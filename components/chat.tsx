import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal, User, Bot } from 'lucide-react'
import { useEffect } from 'react'
import Image from 'next/image'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div
      id="chat-container"
      className="flex flex-col pb-4 gap-4 overflow-y-auto max-h-full"
    >
      {messages.map((message: Message, index: number) => (
        <div
          className={`flex flex-col px-4 py-4 gap-2 w-full ${message.role !== 'user' ? 'bg-muted/30' : ''}`}
          key={index}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            {message.role === 'user' ? (
              <>
                <User className="w-4 h-4" />
                <span>You</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-primary">AI</span>
              </>
            )}
          </div>

          <div className="pl-6 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
            {message.content.map((content, id) => {
              if (content.type === 'text') {
                return <span key={id}>{content.text}</span>
              }
              if (content.type === 'image') {
                return (
                  <Image
                    key={id}
                    src={content.image}
                    alt="fragment"
                    width={48}
                    height={48}
                    unoptimized
                    className="mr-2 inline-block w-12 h-12 object-cover rounded-lg bg-white mb-2"
                  />
                )
              }
            })}
          </div>

          {message.object && (
            <div className="pl-6 mt-2">
              <div
                onClick={() =>
                  setCurrentPreview({
                    fragment: message.object,
                    result: message.result,
                  })
                }
                className="py-3 px-4 w-full md:w-max flex items-center border border-border/50 bg-card hover:bg-accent/50 transition-colors rounded-lg cursor-pointer group"
              >
                <div className="rounded-md w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Terminal strokeWidth={2} className="w-4 h-4 text-primary" />
                </div>
                <div className="pl-3 pr-4 flex flex-col">
                  <span className="font-medium text-sm text-foreground">
                    {message.object.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click to view code
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground animate-pulse">
          <LoaderIcon strokeWidth={2} className="animate-spin w-4 h-4" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  )
}
