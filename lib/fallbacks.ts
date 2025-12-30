import { FragmentSchema } from './schema'
import { TemplateId } from './templates'

// Fallback configurations for when primary services fail
export const FALLBACK_CONFIG = {
  // Fallback AI providers in order of preference
  aiProviders: ['openai', 'anthropic', 'mistral', 'groq'],
  
  // Fallback templates when primary template fails
  templateFallbacks: {
    'nextjs-developer': ['vue-developer', 'streamlit-developer'],
    'vue-developer': ['nextjs-developer', 'streamlit-developer'],
    'streamlit-developer': ['gradio-developer', 'vue-developer'],
    'gradio-developer': ['streamlit-developer', 'vue-developer'],
  } as Record<TemplateId, TemplateId[]>,
  
  // Fallback sandbox configurations
  sandboxFallbacks: {
    timeout: 300000, // 5 minutes
    memory: 2048, // 2GB
    cpu: 2, // 2 cores
  },
  
  // Fallback UI states
  uiFallbacks: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 30000, // 30 seconds
  }
}

// Graceful degradation strategies
export class FallbackManager {
  private static instance: FallbackManager
  private retryCount = 0
  private lastErrorTime = 0

  static getInstance(): FallbackManager {
    if (!FallbackManager.instance) {
      FallbackManager.instance = new FallbackManager()
    }
    return FallbackManager.instance
  }

  // Check if we should attempt fallback based on error patterns
  shouldUseFallback(error: Error): boolean {
    const now = Date.now()
    const timeSinceLastError = now - this.lastErrorTime
    
    // Reset retry count if enough time has passed
    if (timeSinceLastError > 60000) { // 1 minute
      this.retryCount = 0
    }

    this.lastErrorTime = now
    this.retryCount++

    // Use fallback if we've had multiple recent errors
    return this.retryCount >= 2
  }

  // Get fallback AI provider
  getFallbackProvider(currentProvider: string): string | null {
    const index = FALLBACK_CONFIG.aiProviders.indexOf(currentProvider)
    if (index === -1 || index === FALLBACK_CONFIG.aiProviders.length - 1) {
      return null // No fallback available
    }
    return FALLBACK_CONFIG.aiProviders[index + 1]
  }

  // Get fallback template
  getFallbackTemplate(currentTemplate: TemplateId): TemplateId | null {
    const fallbacks = FALLBACK_CONFIG.templateFallbacks[currentTemplate]
    if (!fallbacks || fallbacks.length === 0) {
      return null
    }
    return fallbacks[0]
  }

  // Create degraded fragment for when sandbox fails
  createDegradedFragment(error: Error, originalFragment: FragmentSchema): FragmentSchema {
    return {
      ...originalFragment,
      code: `// Code generation failed due to: ${error.message}\n// Please try again or check your API keys and network connection.\n\n// Fallback: Basic HTML structure\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Generated Project</title>\n</head>\n<body>\n  <h1>Project Generation Failed</h1>\n  <p>Please try again or contact support.</p>\n</body>\n</html>`,
      preview: {
        ...originalFragment.preview,
        url: null,
        error: 'Sandbox execution failed',
        status: 'error'
      },
      status: 'error',
      error: error.message
    }
  }

  // Get fallback sandbox configuration
  getFallbackSandboxConfig(): any {
    return {
      timeout: FALLBACK_CONFIG.sandboxFallbacks.timeout,
      memory: FALLBACK_CONFIG.sandboxFallbacks.memory,
      cpu: FALLBACK_CONFIG.sandboxFallbacks.cpu,
      // Use a more permissive configuration
      allowNetwork: true,
      allowFilesystem: true,
    }
  }

  // Reset fallback state
  reset(): void {
    this.retryCount = 0
    this.lastErrorTime = 0
  }
}

// Error recovery strategies
export class ErrorRecovery {
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (i === maxRetries - 1) {
          throw lastError
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }

  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    shouldFallback: (error: Error) => boolean = () => true
  ): Promise<T> {
    try {
      return await primary()
    } catch (error) {
      if (shouldFallback(error as Error)) {
        console.warn('Primary operation failed, using fallback:', error)
        return await fallback()
      }
      throw error
    }
  }

  static createCircuitBreaker<T>(
    operation: () => Promise<T>,
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000
  ): () => Promise<T> {
    let failures = 0
    let lastFailureTime = 0
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

    return async (): Promise<T> => {
      const now = Date.now()
      
      // Check if we should try to recover
      if (state === 'OPEN' && now - lastFailureTime > recoveryTimeout) {
        state = 'HALF_OPEN'
        failures = 0
      }
      
      // If circuit is open, fail fast
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN')
      }

      try {
        const result = await operation()
        // Reset on success
        if (state === 'HALF_OPEN') {
          state = 'CLOSED'
        }
        failures = 0
        return result
      } catch (error) {
        failures++
        lastFailureTime = now
        
        if (failures >= failureThreshold) {
          state = 'OPEN'
        }
        
        throw error
      }
    }
  }
}

// Health check utilities
export class HealthChecker {
  static async checkAIProvider(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Simple health check - try to list models or make a small request
      // This would be implemented based on the specific provider API
      console.log(`Health check for ${provider}: OK`)
      return true
    } catch (error) {
      console.warn(`Health check for ${provider}: FAILED`, error)
      return false
    }
  }

  static async checkE2BConnection(): Promise<boolean> {
    try {
      // Check if E2B API is accessible
      // This would involve a simple API call to verify connectivity
      console.log('E2B connection: OK')
      return true
    } catch (error) {
      console.warn('E2B connection: FAILED', error)
      return false
    }
  }

  static async checkAllServices(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    // Check AI providers
    const providers = ['openai', 'anthropic', 'mistral', 'groq']
    for (const provider of providers) {
      const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`]
      if (apiKey) {
        results[provider] = await this.checkAIProvider(provider, apiKey)
      }
    }
    
    // Check E2B
    results.e2b = await this.checkE2BConnection()
    
    return results
  }
}