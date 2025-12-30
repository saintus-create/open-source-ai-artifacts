'use client'

import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatusType = 'idle' | 'thinking' | 'generating' | 'success' | 'error'

interface StatusIndicatorProps {
  status: StatusType
  message?: string
  className?: string
}

const statusConfig = {
  idle: {
    icon: Zap,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    label: 'Ready',
  },
  thinking: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    label: 'Thinking',
    animate: true,
  },
  generating: {
    icon: Loader2,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    label: 'Generating',
    animate: true,
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    label: 'Complete',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    label: 'Error',
  },
}

export function StatusIndicator({
  status,
  message,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 border border-border/50 rounded-lg',
        config.bg,
        className
      )}
    >
      <Icon
        className={cn('w-4 h-4', config.color, (config as any).animate && 'animate-spin')}
      />
      <span className={cn('font-medium text-sm', config.color)}>
        {message || config.label}
      </span>
      {(config as any).animate && (
        <div className="flex gap-1 ml-auto">
          <motion.div
            className={cn('rounded-full w-1.5 h-1.5', config.color.replace('text-', 'bg-'))}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className={cn('rounded-full w-1.5 h-1.5', config.color.replace('text-', 'bg-'))}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className={cn('rounded-full w-1.5 h-1.5', config.color.replace('text-', 'bg-'))}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      )}
    </motion.div>
  )
}
