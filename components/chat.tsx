import { ChatMessage } from './chat-message'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
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
      className="flex flex-col gap-2 pb-4 max-h-full overflow-y-auto scroll-smooth"
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
          className="flex items-center gap-3 px-8 py-6 text-muted-foreground text-sm"
        >
          <div className="relative flex justify-center items-center">
            <div className="absolute bg-primary/20 rounded-full w-full h-full animate-ping" />
            <Loader2
              strokeWidth={2}
              className="z-10 relative w-4 h-4 text-primary animate-spin"
            />
          </div>
          <span className="animate-pulse">Thinking...</span>
        </motion.div>
      )}
    </div>
  )
}
