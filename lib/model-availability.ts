import modelsList from './models.json'
import { LLMModel } from './models'

/**
 * Comprehensive model availability detection and management
 */
export class ModelAvailabilityManager {
  private static instance: ModelAvailabilityManager
  private availableModels: LLMModel[] = []
  private checkedProviders: string[] = []
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): ModelAvailabilityManager {
    if (!ModelAvailabilityManager.instance) {
      ModelAvailabilityManager.instance = new ModelAvailabilityManager()
    }
    return ModelAvailabilityManager.instance
  }
  
  /**
   * Detect all available models based on configured API keys
   */
  public detectAvailableModels(): LLMModel[] {
    if (this.availableModels.length > 0) {
      return this.availableModels
    }
    
    const availableProviders = this.detectAvailableProviders()
    
    // Filter models to only those with available providers
    this.availableModels = modelsList.models.filter(model => 
      availableProviders.includes(model.providerId)
    )
    
    console.log(`Model Availability - Detected ${this.availableModels.length} available models`)
    console.log('Available models:', this.availableModels.map(m => `${m.id} (${m.provider})`))
    
    return this.availableModels
  }
  
  /**
   * Get available providers with API keys configured
   */
  private detectAvailableProviders(): string[] {
    if (this.checkedProviders.length > 0) {
      return this.checkedProviders
    }
    
    const providers: string[] = []
    
    // Check for API keys in environment variables
    const providerChecks = [
      { envVar: 'ANTHROPIC_API_KEY', providerId: 'anthropic' },
      { envVar: 'OPENAI_API_KEY', providerId: 'openai' },
      { envVar: 'MISTRAL_API_KEY', providerId: 'mistral' },
      { envVar: 'GROQ_API_KEY', providerId: 'groq' },
      { envVar: 'OPENROUTER_API_KEY', providerId: 'openrouter' },
      { envVar: 'TOGETHER_API_KEY', providerId: 'togetherai' },
      { envVar: 'FIREWORKS_API_KEY', providerId: 'fireworks' },
      { envVar: 'XAI_API_KEY', providerId: 'xai' },
      { envVar: 'DEEPSEEK_API_KEY', providerId: 'deepseek' }
    ]
    
    for (const { envVar, providerId } of providerChecks) {
      if (process.env[envVar]) {
        providers.push(providerId)
      }
    }
    
    // Special handling for Emergent - uses OPENAI_API_KEY but different endpoint
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-emergent-')) {
      providers.push('emergent')
    }
    
    // Ollama doesn't require API keys
    providers.push('ollama')
    
    // Vertex requires JSON credentials
    if (process.env.GOOGLE_VERTEX_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS)
        if (credentials.client_email && credentials.private_key && credentials.project_id) {
          providers.push('vertex')
        }
      } catch (error) {
        console.warn('Model Availability - Invalid GOOGLE_VERTEX_CREDENTIALS JSON')
      }
    }
    
    this.checkedProviders = providers
    return providers
  }
  
  /**
   * Get the best available model for a specific use case
   */
  public getBestModelForUseCase(useCase: 'general' | 'coding' | 'multimodal' | 'fast'): LLMModel | null {
    const availableModels = this.detectAvailableModels()
    
    if (availableModels.length === 0) {
      return null
    }
    
    // Define model preferences for different use cases
    const useCasePreferences: Record<string, string[]> = {
      general: [
        'claude-3-5-sonnet-latest', // Excellent general purpose
        'gpt-4o',                   // Very capable
        'mistral-large-latest',     // Good open-source alternative
        'grok-4',                  // Good general purpose
        'llama-3.3-70b-versatile'  // Capable and versatile
      ],
      coding: [
        'claude-3-5-sonnet-latest', // Excellent for coding
        'deepseek-chat',           // Code-focused
        'llama-3.3-70b-versatile', // Good for coding
        'gpt-4o',                  // Very capable
        'codestral-latest'         // Code-specific
      ],
      multimodal: [
        'claude-3-5-sonnet-latest', // Multimodal capable
        'gpt-4o',                  // Excellent multimodal
        'mistral-large-latest',    // Multimodal capable
        'pixtral-large-latest'     // Vision capable
      ],
      fast: [
        'llama-3.3-70b-versatile', // Fast and capable
        'grok-4',                 // Fast response
        'mistral-large-latest',    // Good speed
        'claude-3-5-haiku-latest' // Fast Claude variant
      ]
    }
    
    const preferredModels = useCasePreferences[useCase] || useCasePreferences.general
    
    // Find the first preferred model that's available
    for (const modelId of preferredModels) {
      const model = availableModels.find(m => m.id === modelId)
      if (model) {
        console.log(`Model Availability - Selected best model for ${useCase}: ${modelId}`)
        return model
      }
    }
    
    // If no preferred models are available, return the first available model
    console.log(`Model Availability - No preferred models for ${useCase}, using first available`)
    return availableModels[0]
  }
  
  /**
   * Check if a specific model is available
   */
  public isModelAvailable(modelId: string): boolean {
    const availableModels = this.detectAvailableModels()
    return availableModels.some(model => model.id === modelId)
  }
  
  /**
   * Get fallback models for a given model
   */
  public getFallbackModels(modelId: string, limit: number = 3): LLMModel[] {
    const availableModels = this.detectAvailableModels()
    const currentModel = modelsList.models.find(m => m.id === modelId)
    
    if (!currentModel) {
      return []
    }
    
    // First try same provider models
    const sameProviderModels = availableModels.filter(m => 
      m.providerId === currentModel.providerId && m.id !== modelId
    )
    
    // Then try different providers
    const differentProviderModels = availableModels.filter(m => 
      m.providerId !== currentModel.providerId
    )
    
    // Combine and limit
    const fallbackModels = [...sameProviderModels, ...differentProviderModels]
    
    console.log(`Model Availability - Found ${fallbackModels.length} fallback models for ${modelId}`)
    
    return fallbackModels.slice(0, limit)
  }
  
  /**
   * Get models by provider
   */
  public getModelsByProvider(providerId: string): LLMModel[] {
    const availableModels = this.detectAvailableModels()
    return availableModels.filter(model => model.providerId === providerId)
  }
  
  /**
   * Clear cache (useful for testing or when environment changes)
   */
  public clearCache(): void {
    this.availableModels = []
    this.checkedProviders = []
    ModelAvailabilityManager.instance = new ModelAvailabilityManager()
  }
}