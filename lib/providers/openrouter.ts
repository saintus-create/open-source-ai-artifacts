import type { BaseLLMProvider, ChatMessage, ProviderInfo } from './base'
import OpenAI from 'openai'

/**
 * OpenRouter provider using the OpenAI-compatible SDK with baseURL override.
 * Streaming is supported via .chat.completions.create({ stream: true }).
 */
export class OpenRouterProvider implements BaseLLMProvider {
  private client: OpenAI
  private model: string

  static POPULAR_MODELS: string[] = [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'meta/llama-3.3-70b',
    'google/gemini-2.0-flash-exp',
    'mistralai/mistral-large',
    'cohere/command-r-plus',
    'perplexity/llama-3.1-sonar-large-128k-online',
    'microsoft/phi-3-medium-128k-instruct',
    'openrouter/auto',
  ]

  constructor(apiKey: string, model: string = 'openrouter/auto') {
    this.model = model
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 2048,
    } as any)
    return response.choices?.[0]?.message?.content ?? ''
  }

  async *sendMessageStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    } as any)

    // The OpenAI SDK returns an iterable stream
    for await (const chunk of stream as any) {
      const token = chunk?.choices?.[0]?.delta?.content
      if (token) yield token
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'OpenRouter',
      provider: 'openrouter',
      model: this.model,
      type: 'aggregator',
      supportedModels: OpenRouterProvider.POPULAR_MODELS,
      description: 'Access to 500+ models from 60+ providers',
    }
  }
}
