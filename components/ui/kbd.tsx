import * as React from 'react'
import { cn } from '@/lib/utils'

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-border/50 bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    )
  }
)
Kbd.displayName = 'Kbd'

export { Kbd }
