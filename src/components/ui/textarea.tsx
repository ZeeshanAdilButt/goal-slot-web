import React from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <div className="flex w-full flex-col gap-2">
      <textarea
        className={cn(
          'min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-[#f2cc0d] focus-visible:ring-1 focus-visible:ring-[#f2cc0d] disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          error && 'border-rose-500 ring-1 ring-rose-500',
          className,
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
