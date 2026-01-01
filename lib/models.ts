import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'
import { createFireworks } from '@ai-sdk/fireworks'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

import { ProviderConfigError } from '@/lib/errors'

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey, baseURL } = config

  const resolved = {
    openai: {
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      baseURL: baseURL || process.env.OPENAI_BASE_URL,
    },
    anthropic: {
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: baseURL || process.env.ANTHROPIC_BASE_URL,
    },
    google: {
      apiKey: apiKey || process.env.GOOGLE_AI_API_KEY,
      baseURL: baseURL || process.env.GOOGLE_BASE_URL,
    },
    mistral: {
      apiKey: apiKey || process.env.MISTRAL_API_KEY,
      baseURL: baseURL || process.env.MISTRAL_BASE_URL,
    },
    groq: {
      apiKey: apiKey || process.env.GROQ_API_KEY,
      baseURL: baseURL || 'https://api.groq.com/openai/v1',
    },
    togetherai: {
      apiKey: apiKey || process.env.TOGETHER_API_KEY,
      baseURL: baseURL || 'https://api.together.xyz/v1',
    },
    fireworks: {
      apiKey: apiKey || process.env.FIREWORKS_API_KEY,
      baseURL: baseURL || 'https://api.fireworks.ai/inference/v1',
    },
    xai: {
      apiKey: apiKey || process.env.XAI_API_KEY,
      baseURL: baseURL || 'https://api.x.ai/v1',
    },
    deepseek: {
      apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: baseURL || 'https://api.deepseek.com/v1',
    },
  } as const

  const providerConfigs = {
    anthropic: () => createAnthropic(resolved.anthropic)(modelNameString),
    openai: () => createOpenAI(resolved.openai)(modelNameString),
    google: () => createGoogleGenerativeAI(resolved.google)(modelNameString),
    mistral: () => createMistral(resolved.mistral)(modelNameString),
    groq: () => createOpenAI(resolved.groq)(modelNameString),
    togetherai: () => createOpenAI(resolved.togetherai)(modelNameString),
    ollama: () => createOllama({ baseURL })(modelNameString),
    fireworks: () => createFireworks(resolved.fireworks)(modelNameString),
    vertex: () => {
      let credentials: any
      try {
        credentials = JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS || '{}')
      } catch {
        throw new ProviderConfigError('vertex', 'Invalid JSON in GOOGLE_VERTEX_CREDENTIALS')
      }
      const required = ['client_email', 'private_key', 'project_id']
      const missing = required.filter((k) => !credentials?.[k])
      if (missing.length) {
        throw new ProviderConfigError('vertex', `Missing required Vertex credential fields: ${missing.join(', ')}`)
      }
      return createVertex({
        googleAuthOptions: { credentials },
      })(modelNameString)
    },
    xai: () => createOpenAI(resolved.xai)(modelNameString),
    deepseek: () => createOpenAI(resolved.deepseek)(modelNameString),
  }

  const createClient = providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  // Enforce API key presence for providers that require it (not ollama)
  const requiresKey = !['ollama', 'vertex'].includes(providerId)
  const res = (resolved as any)[providerId]
  if (requiresKey && !res?.apiKey) {
    throw new ProviderConfigError(providerId, `Missing API key for provider: ${providerId}`)
  }

  return createClient()
}
