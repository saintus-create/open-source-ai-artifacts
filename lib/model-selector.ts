import modelsList from './models.json'
import { LLMModelConfig } from './models'

/**
 * Detects which API keys are available in the environment
 * and returns a prioritized list of available provider IDs
 */
export function detectAvailableProviders(): string[] {
  const providers: string[] = []
  
  // Check for each provider's API key
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic')
  if (process.env.OPENAI_API_KEY) providers.push('openai')
  if (process.env.MISTRAL_API_KEY) providers.push('mistral')
  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter')
  if (process.env.TOGETHER_API_KEY) providers.push('togetherai')
  if (process.env.FIREWORKS_API_KEY) providers.push('fireworks')
  if (process.env.XAI_API_KEY) providers.push('xai')
  if (process.env.DEEPSEEK_API_KEY) providers.push('deepseek')
  
  // Ollama and Vertex don't require API keys in the same way
  providers.push('ollama')
  if (process.env.GOOGLE_VERTEX_CREDENTIALS) providers.push('vertex')
  
  return providers
}

/**
 * Selects the best default model based on available providers
 * Prioritizes models with API keys configured, then falls back to local models
 */
export function getSmartDefaultModel(): LLMModelConfig {
  const availableProviders = detectAvailableProviders()
  console.log('Model Selector - Available providers:', availableProviders)
  
  // Priority order for providers (based on capability and popularity)
  const providerPriority = [
    'anthropic',  // Claude models - excellent overall
    'openai',     // GPT models - very capable
    'mistral',    // Mistral models - good open-source alternative
    'groq',       // Fast inference
    'openrouter', // Multi-provider access
    'togetherai', // Another multi-provider
    'fireworks',  // Specialized models
    'xai',        // Grok models
    'deepseek',   // Code-focused models
    'vertex',     // Google Vertex
    'ollama'      // Local models
  ]
  
  // Find the highest priority provider that's available
  const bestProvider = providerPriority.find(provider => 
    availableProviders.includes(provider)
  )
  
  if (!bestProvider) {
    console.log('Model Selector - No configured providers found, defaulting to first available model')
    return { model: modelsList.models[0].id }
  }
  
  // Select a good default model for the best provider
  const providerModels = modelsList.models.filter(model => 
    model.providerId === bestProvider
  )
  
  if (providerModels.length === 0) {
    console.log('Model Selector - No models found for best provider, defaulting to first available model')
    return { model: modelsList.models[0].id }
  }
  
  // For each provider, select a good default model
  const modelSelection: Record<string, string> = {
    anthropic: 'claude-3-5-sonnet-latest',
    openai: 'gpt-4o',
    mistral: 'mistral-large-latest',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openrouter/auto',
    togetherai: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    fireworks: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    xai: 'grok-4',
    deepseek: 'deepseek-chat',
    vertex: 'gemini-1.5-pro-002',
    ollama: 'llama3.1'
  }
  
  const selectedModel = modelSelection[bestProvider] || providerModels[0].id
  
  console.log(`Model Selector - Selected best model: ${selectedModel} from provider: ${bestProvider}`)
  
  return { model: selectedModel }
}

/**
 * Gets a fallback model configuration when the primary model fails
 * Tries to find a model from a different provider that has API keys configured
 */
export function getFallbackModel(currentModelId: string): LLMModelConfig | null {
  const availableProviders = detectAvailableProviders()
  const currentModel = modelsList.models.find(m => m.id === currentModelId)
  
  if (!currentModel) {
    console.log('Model Selector - Current model not found in models list')
    return null
  }
  
  // If current provider is available, try other models from same provider first
  if (availableProviders.includes(currentModel.providerId)) {
    const sameProviderModels = modelsList.models.filter(m => 
      m.providerId === currentModel.providerId && m.id !== currentModelId
    )
    
    if (sameProviderModels.length > 0) {
      console.log(`Model Selector - Fallback to same provider model: ${sameProviderModels[0].id}`)
      return { model: sameProviderModels[0].id }
    }
  }
  
  // Try different providers
  const otherProviders = availableProviders.filter(p => p !== currentModel.providerId)
  
  for (const provider of otherProviders) {
    const providerModels = modelsList.models.filter(m => m.providerId === provider)
    if (providerModels.length > 0) {
      console.log(`Model Selector - Fallback to different provider model: ${providerModels[0].id}`)
      return { model: providerModels[0].id }
    }
  }
  
  console.log('Model Selector - No fallback model available')
  return null
}