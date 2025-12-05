'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Code, Sparkles, Zap, Layers, ChevronRight } from 'lucide-react'

const examples = [
  {
    icon: Code,
    title: 'Interactive Dashboard',
    prompt: 'Create a modern analytics dashboard with charts showing sales data',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Sparkles,
    title: 'Todo App',
    prompt: 'Build a beautiful todo list app with drag and drop functionality',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Zap,
    title: 'Data Visualization',
    prompt: 'Generate a Python script to visualize stock market data with interactive plots',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Layers,
    title: 'Game Component',
    prompt: 'Create a simple tic-tac-toe game with React',
    color: 'from-green-500 to-emerald-500',
  },
]

export function WelcomeScreen({
  onExampleClick,
}: {
  onExampleClick: (prompt: string) => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 animate-float">
              Antigravity
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground mb-2"
          >
            Transform ideas into interactive code instantly
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground/70"
          >
            Powered by AI • Built with Next.js • Secured by E2B
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 text-center text-foreground/90">
            Try these examples to get started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Card
                  className="group relative overflow-hidden cursor-pointer border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm"
                  onClick={() => onExampleClick(example.prompt)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${example.color} shadow-lg`}
                      >
                        <example.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {example.title}
                        </h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {example.prompt}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground/60 mb-4">
            Or describe what you want to build below
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground border border-border/50">
              ⌘K Shortcuts
            </div>
            <div className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground border border-border/50">
              Multi-modal Support
            </div>
            <div className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground border border-border/50">
              Live Preview
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
