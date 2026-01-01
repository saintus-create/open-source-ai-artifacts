import type { LanguageModel } from 'ai'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderInfo {
  name: string
  provider: string
  model: string
  type: string
  supportedModels?: string[]
  description?: string
}

export interface BaseLLMProvider<M extends ChatMessage = ChatMessage> {
  sendMessage(messages: M[]): Promise<string>
  sendMessageStream(messages: M[]): AsyncGenerator<string, void, unknown>
  getProviderInfo(): ProviderInfo
}
