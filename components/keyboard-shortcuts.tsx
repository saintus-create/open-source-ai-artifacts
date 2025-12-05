'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { motion, AnimatePresence } from 'framer-motion'

const shortcuts = [
  {
    category: 'General',
    items: [
      { keys: ['⌘', 'K'], description: 'Toggle shortcuts panel' },
      { keys: ['⌘', 'Enter'], description: 'Send message' },
      { keys: ['Esc'], description: 'Stop generation' },
      { keys: ['⌘', '⌫'], description: 'Clear chat' },
      { keys: ['⌘', 'Z'], description: 'Undo last message' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Tab'], description: 'Switch between code/preview' },
      { keys: ['⌘', 'D'], description: 'Toggle dark mode' },
      { keys: ['⌘', '/'], description: 'Focus input' },
    ],
  },
]

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">⌨️</span> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate Antigravity faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <AnimatePresence>
            {shortcuts.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.description}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: sectionIndex * 0.1 + itemIndex * 0.05,
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {item.description}
                      </span>
                      <div className="flex gap-1">
                        {item.keys.map((key, i) => (
                          <Kbd key={i}>{key}</Kbd>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Press{' '}
            <Kbd className="inline-flex mx-1">⌘</Kbd>
            <Kbd className="inline-flex mx-1">K</Kbd> anytime to view this
            panel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
