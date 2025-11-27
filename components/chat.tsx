import { ChatMessage } from './chat-message'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      className="flex flex-col pb-4 gap-2 overflow-y-auto max-h-full scroll-smooth"
    >
      <AnimatePresence initial={false}>
        {messages.map((message: Message, index: number) => (
          <ChatMessage
            key={index}
            message={message}
            setCurrentPreview={setCurrentPreview}
          />
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 px-8 py-6 text-sm text-muted-foreground"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full h-full rounded-full bg-primary/20 animate-ping" />
            <LoaderIcon
              strokeWidth={2}
              className="animate-spin w-4 h-4 text-primary relative z-10"
            />
          </div>
          <span className="animate-pulse">Thinking...</span>
        </motion.div>
      )}
    </div>
  )
}
