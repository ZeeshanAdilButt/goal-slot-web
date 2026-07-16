import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800',
        secondary: 'border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50',
        outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50',
        ghost: 'text-zinc-700 hover:bg-zinc-100',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
        brand: 'bg-[#f2cc0d] text-zinc-900 hover:bg-[#d9b307]',
      },
      size: {
        // Tightened in 2026 pass: default h-9 + text-sm so a labelless
        // <Button> across the app reads as compact, matching the rest
        // of the form chrome instead of standing out as oversized.
        default: 'h-9 px-3.5',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
