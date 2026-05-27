import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-zinc-200 bg-zinc-50 text-zinc-700",
        secondary: "border-zinc-200 bg-zinc-50 text-zinc-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
        destructive: "border-rose-200 bg-rose-50 text-rose-700",
        brand: "border-yellow-400/20 bg-yellow-400/10 text-yellow-700",
        outline: "border-zinc-200 text-zinc-700 bg-transparent",
        live: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
