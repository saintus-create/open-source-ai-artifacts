'use client'

import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import templates, { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { SetStateAction, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocalStorage } from 'usehooks-ts'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>(
    'auto',
  )
  
  // Use comprehensive model availability detection
  const getSmartDefaultModel = () => {
    try {
      // Simplified version of the model availability detection for client-side
      // In a real implementation, this would use the ModelAvailabilityManager
      
      // Check which API keys are available (NEXT_PUBLIC_ prefixed for browser)
      const availableProviders: string[] = []
      
      if (typeof window !== 'undefined') {
        // Check for API keys - these would be set as NEXT_PUBLIC_* in environment
        if (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) availableProviders.push('anthropic')
        if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) availableProviders.push('openai')
        if (process.env.NEXT_PUBLIC_MISTRAL_API_KEY) availableProviders.push('mistral')
        if (process.env.NEXT_PUBLIC_GROQ_API_KEY) availableProviders.push('groq')
        if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) availableProviders.push('openrouter')
        if (process.env.NEXT_PUBLIC_TOGETHER_API_KEY) availableProviders.push('togetherai')
        if (process.env.NEXT_PUBLIC_FIREWORKS_API_KEY) availableProviders.push('fireworks')
        if (process.env.NEXT_PUBLIC_XAI_API_KEY) availableProviders.push('xai')
        if (process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) availableProviders.push('deepseek')
        
        // Special handling for Emergent - uses OPENAI_API_KEY but different endpoint
        if (process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY.startsWith('sk-emergent-')) {
          availableProviders.push('emergent')
        }
      }
      
      // Always include ollama (local models)
      availableProviders.push('ollama')
      
      console.log('Available providers detected:', availableProviders)
      
      // Smart priority order based on capability, cost, and reliability
      const providerPriority = [
        'openrouter',    // 1. Multi-provider access - best flexibility
        'emergent',     // 2. Emergent proxy for OpenAI models
        'groq',         // 3. Fast inference with good models
        'anthropic',    // 4. Excellent quality (Claude models)
        'mistral',      // 5. Good open-source alternative
        'togetherai',   // 6. Another multi-provider option
        'fireworks',    // 7. Specialized models
        'openai',       // 8. Very capable but may have higher costs
        'xai',          // 9. Grok models
        'deepseek',     // 10. Code-focused models
        'ollama'        // 11. Local models (fallback)
      ]
      
      // Find the best available provider
      const bestProvider = providerPriority.find(provider =>
        availableProviders.includes(provider)
      )
      
      if (!bestProvider) {
        console.warn('No configured providers found, defaulting to first model')
        return { model: modelsList.models[0].id }
      }
      
      // Map providers to their best default models
      const modelRecommendations: Record<string, string> = {
        anthropic: 'claude-3-5-sonnet-latest',      // Best Claude model
        openai: 'gpt-4o',                           // Best OpenAI model
        mistral: 'mistral-large-latest',            // Best Mistral model
        groq: 'llama-3.3-70b-versatile',           // Fast and versatile
        emergent: 'gpt-4o-emergent',              // GPT-4o via Emergent proxy
        openrouter: 'openrouter/auto',              // Auto-select best
        togetherai: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', // Best Together model
        fireworks: 'accounts/fireworks/models/llama-v3p1-70b-instruct', // Good Fireworks model
        xai: 'grok-4',                              // Best Grok model
        deepseek: 'deepseek-chat',                 // Best DeepSeek model
        ollama: 'llama3.1'                         // Good local model
      }
      
      const recommendedModel = modelRecommendations[bestProvider]
      
      console.log(`Smart model selection: ${bestProvider} -> ${recommendedModel}`)
      
      return { model: recommendedModel }
    } catch (error) {
      console.error('Error in smart model selection:', error)
      // Fallback to a safe default
      return { model: 'claude-3-5-sonnet-latest' }
    }
  }
  
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    getSmartDefaultModel(),
  )

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Core-only mode: no auth
  const session: null = null
  const userTeam: { id?: string } | undefined = undefined

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model,
  )
  const currentTemplate = useMemo(() =>
    selectedTemplate === 'auto'
      ? templates
      : { [selectedTemplate]: templates[selectedTemplate] },
    [selectedTemplate]
  )

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/chat',
    schema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      if (error.message.includes('limit')) {
        setIsRateLimited(true)
      }

      setErrorMessage(error.message)
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        setIsPreviewLoading(true)
        // In core-only mode, we skip sandbox execution and just show the fragment
        setFragment(fragment)
        setCurrentTab(
          fragment?.template === 'code-interpreter-v1' ? 'fragment' : 'code',
        )
        setIsPreviewLoading(false)
      }
    },
  })

  const addMessage = useCallback((message: Message) => {
    setMessages((previousMessages) => [...previousMessages, message])
    return [...messagesRef.current, message]
  }, [])

  const setMessage = useCallback((message: Partial<Message>, index?: number) => {
    setMessages((previousMessages) => {
      const updatedMessages = [...previousMessages]
      updatedMessages[index ?? previousMessages.length - 1] = {
        ...previousMessages[index ?? previousMessages.length - 1],
        ...message,
      }

      return updatedMessages
    })
  }, [])

  useEffect(() => {
    if (object) {
      setFragment(object)
      const content: Message['content'] = [
        { type: 'text', text: object.commentary || '' },
        { type: 'code', text: object.code?.[0]?.file_content || '' },
      ]

      const lastMessage = messagesRef.current[messagesRef.current.length - 1]

      if (!lastMessage || lastMessage.role !== 'assistant') {
        addMessage({
          role: 'assistant',
          content,
          object,
        })
      }

      if (lastMessage && lastMessage.role === 'assistant') {
        setMessage({
          content,
          object,
        })
      }
    }
  }, [object, addMessage, setMessage])

  useEffect(() => {
    if (error) stop()
  }, [error, stop])

  const handleSubmitAuth = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isLoading) {
      stop()
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      images.forEach((image) => {
        content.push({ type: 'image', image })
      })
    }

    const updatedMessages = addMessage({
      role: 'user',
      content,
    })

    submit({
      userID: undefined,
      teamID: undefined,
      messages: toAISDKMessages(updatedMessages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })

    setChatInput('')
    setFiles([])
    setCurrentTab('code')
  }, [isLoading, stop, chatInput, files, addMessage, submit, currentTemplate, currentModel, languageModel, setChatInput])

  const retry = useCallback(() => {
    submit({
      userID: undefined,
      teamID: undefined,
      messages: toAISDKMessages(messages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })
  }, [submit, messages, currentTemplate, currentModel, languageModel])

  const handleSaveInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value)
  }, [setChatInput])

  const handleFileChange = useCallback((change: SetStateAction<File[]>) => {
    setFiles(change)
  }, [])

  const handleLanguageModelChange = useCallback((e: LLMModelConfig) => {
    setLanguageModel({ ...languageModel, ...e })
  }, [languageModel, setLanguageModel])

  const handleSocialClick = useCallback((target: 'github' | 'x' | 'discord') => {
    if (target === 'github') {
      window.open('https://github.com/e2b-dev/fragments', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/e2b_dev', '_blank')
    } else if (target === 'discord') {
      window.open('https://discord.gg/U7KEcGErtQ', '_blank')
    }
  }, [])

  const handleClearChat = useCallback(() => {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
  }, [stop, setChatInput])

  const setCurrentPreview = useCallback((preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => {
    setFragment(preview.fragment)
    setResult(preview.result)
  }, [])

  const handleUndo = useCallback(() => {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ fragment: undefined, result: undefined })
  }, [setCurrentPreview])

  if (!isMounted) return null

  return (
    <main className="flex min-h-screen max-h-screen">
      <div className="grid md:grid-cols-2 w-full">
        <div
          className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${fragment ? 'col-span-1' : 'col-span-2'}`}
        >
          <NavBar
            session={null as any}
            showLogin={() => { }}
            signOut={() => { }}
            onSocialClick={handleSocialClick}
            onClear={handleClearChat}
            canClear={messages.length > 0}
            canUndo={messages.length > 1 && !isLoading}
            onUndo={handleUndo}
          />
          <Chat
            messages={messages}
            isLoading={isLoading}
            setCurrentPreview={setCurrentPreview}
          />
          <ChatInput
            retry={retry}
            isErrored={error !== undefined}
            errorMessage={errorMessage}
            isLoading={isLoading}
            isRateLimited={isRateLimited}
            stop={stop}
            input={chatInput}
            handleInputChange={handleSaveInputChange}
            handleSubmit={handleSubmitAuth}
            isMultiModal={currentModel?.multiModal || false}
            files={files}
            handleFileChange={handleFileChange}
          >
            <ChatPicker
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
              models={filteredModels}
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
            />
            <ChatSettings
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
              apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
              baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
            />
          </ChatInput>
        </div>
        <Preview
          teamID={undefined}
          accessToken={undefined}
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          isChatLoading={isLoading}
          isPreviewLoading={isPreviewLoading}
          fragment={fragment}
          result={result as ExecutionResult}
          onClose={() => setFragment(undefined)}
        />
      </div>
    </main>
  )
}
