import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toGenerationPrompt } from '@/lib/prompt'
import { fragmentSchema as schema } from '@/lib/schema'
import { astSchema } from '@/lib/ast-schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel } from 'ai'
import { jsonError, methodGuard, parseJson, withTimeout } from '@/lib/api-utils'
import { z } from 'zod'
import { OpenRouterProvider } from '@/lib/providers/openrouter'
import { DelegatingProvider } from '@/lib/providers/delegating'
import { rateLimit, rateLimitAsync, getClientKey } from '@/lib/rate-limit'
import { getRateLimitConfig } from '@/lib/validation'
import { monitoringManager } from '@/lib/monitoring'

export const maxDuration = 60

// Rate limit config (currently unused). Consider enabling via a KV store.
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

// Validate incoming request body to prevent malformed inputs from crashing the handler
const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
  userID: z.string().optional(),
  teamID: z.string().optional(),
  template: z.any(), // runtime validation for Templates is out-of-scope here
  model: z.object({
    id: z.string(),
    name: z.string(),
    provider: z.string(),
    providerId: z.string(),
  }),
  config: z.object({
    model: z.string().optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(0).optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
    maxTokens: z.number().min(1).optional(),
  }),
  mode: z.enum(['text', 'ast', 'raw']).optional(),
  provider: z.enum(['default', 'openrouter']).optional(),
  apiKey: z.string().optional(),
  modelOverride: z.string().optional(),
})

function genRequestId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function POST(req: Request) {
  // Guard HTTP method for consistency and clearer errors
  const guard = methodGuard(req, ['POST'])
  if (guard) return guard

  // Parse and validate JSON body
  const parsed = await parseJson(ChatRequestSchema)(req)
  if (!parsed.ok) return parsed.error

  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
    mode = 'text',
    provider: providerSel = 'default',
    apiKey: apiKeyOverride,
    modelOverride,
  }: {
    messages: any[]
    userID?: string
    teamID?: string
    template: Templates
    model: LLMModel
    config: LLMModelConfig
    mode?: 'text' | 'ast' | 'raw'
    provider?: 'default' | 'openrouter'
    apiKey?: string
    modelOverride?: string
  } = parsed.data

  // Debug logging
  console.log('Chat API - Parsed request data:', {
    messages: messages.length,
    model: model?.id,
    provider: model?.providerId,
    mode,
    providerSel,
    hasApiKeyOverride: !!apiKeyOverride
  })

  // Whitelist model generation parameters supported by streamObject/model
  const {
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    maxTokens,
  } = config

  // Apply rate limiting using userID/teamID if present, falling back to IP
  {
    const key = getClientKey(req, { userID, teamID })
    const { maxRequests, windowMs } = getRateLimitConfig()
    const rl = await rateLimitAsync(key, maxRequests, windowMs)
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? windowMs) / 1000)
      const body = { error: { code: 'rate_limited', message: 'Too many requests. Please try again later.', details: { retryAfterMs: rl.retryAfterMs } } }
      return new Response(JSON.stringify(body), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(Math.max(0, rl.remaining)),
        },
      })
    }
  }

  const requestId = genRequestId()
  const stopTimer = monitoringManager.startTimer('chat_request')

  try {
    // Debug logging for model client creation
    console.log('Chat API - Creating model client for:', model?.id, 'provider:', model?.providerId)

    // Raw text path using provider abstraction (OpenRouter currently)
    if (mode === 'raw' && providerSel === 'openrouter') {
      const apiKey = apiKeyOverride || process.env.OPENROUTER_API_KEY
      console.log('Chat API - OpenRouter API key available:', !!apiKey)
      if (!apiKey) return jsonError('invalid_provider_config', 'Missing OpenRouter API key', 400)
      const orModel = modelOverride || config.model || model?.id || 'openrouter/auto'
      console.log('Chat API - Using OpenRouter model:', orModel)
      const provider = new OpenRouterProvider(apiKey, orModel)

      // SSE stream with timeout and abort
      const encoder = new TextEncoder()
      const controller = new AbortController()
      const reqSignal: AbortSignal | undefined = (req as any).signal
      if (reqSignal) reqSignal.addEventListener('abort', () => controller.abort(), { once: true })

      const sse = new ReadableStream({
        async start(streamController) {
          const HEARTBEAT_MS = 10000
          let heartbeatId: any
          const send = (data: string) => streamController.enqueue(encoder.encode(`data: ${data}\n\n`))
          try {
            heartbeatId = setInterval(() => send('[heartbeat]'), HEARTBEAT_MS)
            for await (const token of provider.sendMessageStream(messages as any)) {
              send(token)
            }
            send('[done]')
            clearInterval(heartbeatId)
            streamController.close()
          } catch (e: any) {
            clearInterval(heartbeatId)
            streamController.error(e)
          }
        },
        cancel() {
          controller.abort()
        },
      })

      const res = new Response(sse, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Request-Id': requestId,
          'X-Provider': 'openrouter',
          'X-Model': orModel,
        },
      })
      monitoringManager.recordMetric('usage', { event: 'chat_raw', provider: 'openrouter', model: orModel })
      return res
    }

    // Default structured generation path (text or ast)
    console.log('Chat API - Creating model client with config:', {
      modelId: model?.id,
      providerId: model?.providerId,
      hasApiKey: !!config.apiKey,
      hasBaseURL: !!config.baseURL
    })
    const modelClient = getModelClient(model, config)
    console.log('Chat API - Model client created successfully')

    const streamPromise = streamObject({
      model: modelClient as LanguageModel,
      schema: (mode === 'ast' ? astSchema : schema) as any,
      system: toGenerationPrompt(template),
      messages,
      maxRetries: 3,
      // Whitelisted params only
      temperature,
      topP,
      topK,
      frequencyPenalty,
      presencePenalty,
      maxTokens,
    })

    // Apply timeout and tie to request abort signal when available
    const stream = await withTimeout(streamPromise, maxDuration * 1000, (req as any).signal)

    const base = stream.toTextStreamResponse()
    const res = new Response(base.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Request-Id': requestId,
        'X-Provider': model?.providerId,
        'X-Model': model?.id,
      },
    })
    monitoringManager.recordMetric('usage', { event: 'chat_structured', mode, provider: model?.providerId, model: model?.id })
    stopTimer()
    return res
  } catch (error: any) {
    // Debug logging for error analysis
    console.error('Chat API - Error occurred:', {
      errorName: error?.name,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStack: error?.stack,
      providerCode: error?.error?.code,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data
    })

    // Smart fallback mechanism based on available providers
    if (error?.name === 'ProviderConfigError') {
      console.log('Chat API - Attempting smart fallback')
      
      // Try OpenRouter first if available (multi-provider access)
      const openRouterApiKey = process.env.OPENROUTER_API_KEY
      if (openRouterApiKey && providerSel !== 'openrouter') {
        console.log('Chat API - Attempting fallback to OpenRouter')
        try {
          const orModel = modelOverride || config.model || model?.id || 'openrouter/auto'
          const provider = new OpenRouterProvider(openRouterApiKey, orModel)

          const encoder = new TextEncoder()
          const controller = new AbortController()
          const reqSignal: AbortSignal | undefined = (req as any).signal
          if (reqSignal) reqSignal.addEventListener('abort', () => controller.abort(), { once: true })

          const sse = new ReadableStream({
            async start(streamController) {
              const HEARTBEAT_MS = 10000
              let heartbeatId: any
              const send = (data: string) => streamController.enqueue(encoder.encode(`data: ${data}\n\n`))
              try {
                heartbeatId = setInterval(() => send('[heartbeat]'), HEARTBEAT_MS)
                for await (const token of provider.sendMessageStream(messages as any)) {
                  send(token)
                }
                send('[done]')
                clearInterval(heartbeatId)
                streamController.close()
              } catch (e: any) {
                clearInterval(heartbeatId)
                streamController.error(e)
              }
            },
            cancel() {
              controller.abort()
            },
          })

          const res = new Response(sse, {
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Request-Id': requestId,
              'X-Provider': 'openrouter',
              'X-Model': orModel,
              'X-Fallback': 'true',
            },
          })
          monitoringManager.recordMetric('usage', { event: 'chat_raw_fallback', provider: 'openrouter', model: orModel })
          console.log('Chat API - Successfully fell back to OpenRouter')
          return res
        } catch (fallbackError) {
          console.error('Chat API - Fallback to OpenRouter also failed:', fallbackError)
        }
      }

      // Try other available providers in priority order
      const providerPriority = [
        { key: 'GROQ_API_KEY', providerId: 'groq', model: 'llama-3.3-70b-versatile' },
        { key: 'MISTRAL_API_KEY', providerId: 'mistral', model: 'mistral-large-latest' },
        { key: 'OPENAI_API_KEY', providerId: 'openai', model: 'gpt-4o' },
        { key: 'TOGETHER_API_KEY', providerId: 'togetherai', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' }
      ]

      for (const { key, providerId, model: fallbackModel } of providerPriority) {
        if (providerSel === providerId) continue // Skip current provider
        
        const apiKey = process.env[key]
        if (apiKey) {
          try {
            console.log(`Chat API - Attempting fallback to ${providerId}`)
            
            // For non-OpenRouter providers, we need to use the structured path
            // This is more complex and would require re-creating the model client
            // For now, we'll just log that we could fall back and continue
            console.log(`Chat API - Could fall back to ${providerId} with model ${fallbackModel}`)
            
            // In a full implementation, we would:
            // 1. Create a new model client for the fallback provider
            // 2. Re-run the streamObject call with the new client
            // 3. Return the response
            
            break // Found a viable fallback
          } catch (secondaryFallbackError) {
            console.error(`Chat API - Fallback to ${providerId} also failed:`, secondaryFallbackError)
          }
        }
      }
    }

    // Normalize provider and validation errors into consistent JSON
    const status = error?.status ?? error?.statusCode ?? error?.response?.status
    const providerCode = error?.code ?? error?.error?.code ?? error?.response?.data?.error?.code

    // Handle provider configuration errors specifically
    if (error?.name === 'ProviderConfigError') {
      return jsonError('provider_config_error', error.message, 400, {
        provider: error?.provider,
        suggestion: 'Please configure the required API key in your environment variables'
      })
    }

    // Handle schema validation errors thrown during object streaming
    if (error?.name === 'ZodError' || error?.cause?.name === 'ZodError') {
      const details = (error?.issues || error?.cause?.issues) ?? undefined
      console.error('Chat API - Schema validation error:', details)
      return jsonError('schema_validation_error', 'Model output did not match expected schema', 400, details)
    }

    // Invalid/missing provider configuration (e.g., bad JSON credentials or no API key)
    if (error?.name === 'SyntaxError' || /credentials/i.test(String(error?.message))) {
      return jsonError('invalid_provider_config', 'Invalid provider configuration', 400)
    }

    switch (status) {
      case 401:
      case 403:
        return jsonError('unauthorized', 'Access denied. Check your API key.', status)
      case 429:
        return jsonError('rate_limited', 'Rate limit exceeded. Please try again later.', 429)
      case 503:
      case 529:
        return jsonError('provider_unavailable', 'Provider overloaded. Please try again later.', status)
      default: {
        const code = providerCode || 'generation_failed'
        const message = error?.message || 'Generation failed'
        const details = { provider: model?.providerId, model: model?.id, requestId }
        monitoringManager.reportError(error, { code, ...details })
        return jsonError(code, message, typeof status === 'number' ? status : 500, details)
      }
    }
  } finally {
    try { stopTimer() } catch {}
  }
}
