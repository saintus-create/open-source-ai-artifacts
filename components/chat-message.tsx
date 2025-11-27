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
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground mb-1">
                {isUser ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-foreground font-semibold tracking-tight">You</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-primary font-semibold tracking-tight">Antigravity</span>
                    </div>
                )}
            </div>

            <div className="pl-9 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
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
                                className="relative inline-block mt-2"
                            >
                                <Image
                                    src={content.image}
                                    alt="fragment"
                                    width={200}
                                    height={200}
                                    unoptimized
                                    className="w-auto max-h-[200px] object-cover rounded-xl border border-border/50 shadow-sm"
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
                    className="pl-9 mt-3"
                >
                    <div
                        onClick={() =>
                            setCurrentPreview({
                                fragment: message.object,
                                result: message.result,
                            })
                        }
                        className="py-3 px-4 w-full md:w-[300px] flex items-center gap-3 border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 rounded-xl cursor-pointer group backdrop-blur-sm shadow-sm hover:shadow-md"
                    >
                        <div className="rounded-lg w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-105 duration-200">
                            <Terminal strokeWidth={2} className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {message.object.title || 'Untitled Fragment'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                Click to view code & preview
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
