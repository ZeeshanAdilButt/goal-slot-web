import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-6 h-6 border-2',
  md: 'w-12 h-12 border-4',
  lg: 'w-16 h-16 border-4',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin border-secondary border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  )
}
