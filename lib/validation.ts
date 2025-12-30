import { z } from 'zod'

// Environment variable validation schema
export const envSchema = z.object({
  // Required variables
  E2B_API_KEY: z.string().min(1, 'E2B_API_KEY is required'),
  OPENAI_API_KEY: z.string().optional(),
  
  // Optional AI provider keys
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  FIREWORKS_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  GOOGLE_VERTEX_CREDENTIALS: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  
  // Optional configuration
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
  RATE_LIMIT_WINDOW: z.string().optional(),
  
  // Optional services
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  
  // Feature flags
  NEXT_PUBLIC_NO_API_KEY_INPUT: z.string().optional(),
  NEXT_PUBLIC_NO_BASE_URL_INPUT: z.string().optional(),
  NEXT_PUBLIC_HIDE_LOCAL_MODELS: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnvironment(): EnvConfig {
  try {
    const env = envSchema.parse(process.env)
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `  - ${issue.path.join('.')}: ${issue.message}`
      ).join('\n')
      
      throw new Error(
        `Environment validation failed:\n${issues}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      )
    }
    throw error
  }
}

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

export function isFeatureEnabled(featureFlag: string): boolean {
  return process.env[featureFlag] !== undefined
}

export function getRateLimitConfig() {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)
  
  return {
    maxRequests: isNaN(maxRequests) ? 100 : maxRequests,
    windowMs: isNaN(windowMs) ? 60000 : windowMs,
  }
}

export function getAvailableProviders(): string[] {
  const providers: string[] = []
  
  if (process.env.OPENAI_API_KEY) providers.push('openai')
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic')
  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.FIREWORKS_API_KEY) providers.push('fireworks')
  if (process.env.TOGETHER_API_KEY) providers.push('together')
  if (process.env.GOOGLE_AI_API_KEY) providers.push('google')
  if (process.env.GOOGLE_VERTEX_CREDENTIALS) providers.push('google-vertex')
  if (process.env.MISTRAL_API_KEY) providers.push('mistral')
  if (process.env.XAI_API_KEY) providers.push('xai')
  
  return providers
}

export function validateProviderConfig(provider: string, apiKey?: string): boolean {
  if (!apiKey) {
    console.warn(`Warning: ${provider} API key is not configured`)
    return false
  }
  
  // Basic validation for API key format
  if (apiKey.length < 10) {
    console.warn(`Warning: ${provider} API key appears to be invalid`)
    return false
  }
  
  return true
}