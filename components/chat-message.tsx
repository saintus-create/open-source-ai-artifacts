import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { Terminal, User, Bot, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export function ChatMessage({
    message,
    setCurrentPreview,
}: {
    message: Message
    setCurrentPreview: (preview: {
        fragment: DeepPartial<FragmentSchema> | undefined
        result: ExecutionResult | undefined
    }) => void
}) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex flex-col px-4 py-6 gap-2 w-full ${!isUser ? 'bg-muted/30 border-y border-border/30' : ''
                }`}
        >
            <div className="flex items-center gap-3 mb-1 font-medium text-muted-foreground text-sm">
                {isUser ? (
                    <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center bg-gradient-to-tr from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20 rounded-full w-6 h-6">
                            <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-foreground tracking-tight">You</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center bg-primary shadow-lg shadow-primary/20 rounded-full w-6 h-6">
                            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-primary tracking-tight">Antigravity</span>
                    </div>
                )}
            </div>

            <div className="pl-9 font-sans text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                {message.content.map((content, id) => {
                    if (content.type === 'text') {
                        return <span key={id}>{content.text}</span>
                    }
                    if (content.type === 'image') {
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={id}
                                className="inline-block relative mt-2"
                            >
                                <Image
                                    src={content.image}
                                    alt="fragment"
                                    width={200}
                                    height={200}
                                    unoptimized
                                    className="shadow-sm border border-border/50 rounded-xl w-auto max-h-[200px] object-cover"
                                />
                            </motion.div>
                        )
                    }
                })}
            </div>

            {message.object && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-3 pl-9"
                >
                    <button
                        onClick={() =>
                            setCurrentPreview({
                                fragment: message.object,
                                result: message.result,
                            })
                        }
                        className="group flex items-center gap-3 bg-card/50 hover:bg-accent/50 shadow-sm hover:shadow-md backdrop-blur-sm px-4 py-3 border border-border/50 hover:border-primary/20 rounded-xl w-full md:w-[300px] text-left transition-all duration-200 cursor-pointer"
                    >
                        <div className="flex justify-center items-center bg-primary/10 group-hover:bg-primary/20 rounded-lg w-10 h-10 group-hover:scale-105 transition-colors duration-200">
                            <Terminal strokeWidth={2} className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-foreground group-hover:text-primary text-sm truncate transition-colors">
                                {message.object.title || 'Untitled Fragment'}
                            </span>
                            <span className="text-muted-foreground text-xs truncate">
                                Click to view code & preview
                            </span>
                        </div>
                    </button>
                </motion.div>
            )}
        </motion.div>
    )
}
