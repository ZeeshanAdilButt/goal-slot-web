import { cn } from '@/lib/utils'
import { GoalSlotSpinner } from '@/components/goalslot-logo'

type LoadingProps = {
  variant?: 'spinner' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

const skeletonSizeClasses = {
  sm: 'h-4',
  md: 'h-8',
  lg: 'h-12',
}

export function Loading({ variant = 'spinner', size = 'sm', className, fullWidth }: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div
        className={cn(
          'animate-pulse rounded-md bg-primary/10',
          skeletonSizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
      />
    )
  }

  // Map Loading sizes to GoalSlotSpinner sizes to maintain similar dimensions
  // Loading sm(h-6) -> GoalSlot xs(h-6)
  // Loading md(h-12) -> GoalSlot lg(h-12)
  // Loading lg(h-16) -> GoalSlot xl(h-14) - closest available
  const spinnerSize = size === 'sm' ? 'xs' : size === 'md' ? 'lg' : 'xl'

  return <GoalSlotSpinner size={spinnerSize} className={className} />
}
