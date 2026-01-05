import { cn } from '@/lib/utils'

type LoadingProps = {
  variant?: 'spinner' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

const sizeClasses = {
  spinner: {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4',
  },
  skeleton: {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
  },
}

export function Loading({ variant = 'spinner', size = 'sm', className, fullWidth }: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div
        className={cn(
          'animate-pulse rounded-md bg-primary/10',
          sizeClasses.skeleton[size],
          fullWidth && 'w-full',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-secondary border-t-primary',
        sizeClasses.spinner[size],
        className,
      )}
    />
  )
}
