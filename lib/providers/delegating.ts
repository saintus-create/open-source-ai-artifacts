import type { BaseLLMProvider, ChatMessage, ProviderInfo } from './base'
import { getModelClient } from '@/lib/models'
import type { LLMModel, LLMModelConfig } from '@/lib/models'
import { generateText } from 'ai'

/**
 * Delegates to existing providers via lib/models.ts and ai-sdk generateText.
 * This yields plain text or token-level streaming via manual buffering.
 */
export class DelegatingProvider implements BaseLLMProvider {
  private model: LLMModel
  private config: LLMModelConfig

  constructor(model: LLMModel, config: LLMModelConfig) {
    this.model = model
    this.config = config
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const client = getModelClient(this.model, this.config)
    const { text } = await generateText({
      model: client as any,
      messages: messages as any,
      temperature: this.config.temperature,
      topP: this.config.topP,
      topK: this.config.topK,
      maxTokens: this.config.maxTokens,
    })
    return text
  }

  async *sendMessageStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    // Fallback: generateText does not expose token stream across all providers in a uniform way here.
    // As a simple approach, call sendMessage and yield once. Replace with provider-native streaming if needed.
    const full = await this.sendMessage(messages)
    yield full
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: `Delegate (${this.model.providerId})`,
      provider: this.model.providerId,
      model: this.model.id,
      type: 'native',
    }
  }
}
