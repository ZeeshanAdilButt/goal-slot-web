import { cn } from '@/lib/utils'

interface GoalsFiltersProps {
  filter: string
  onFilterChange: (filter: string) => void
}

export function GoalsFilters({ filter, onFilterChange }: GoalsFiltersProps) {
  return (
    <div className="flex gap-2">
      {['ACTIVE', 'COMPLETED', 'PAUSED'].map((status) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={cn(
            'px-4 py-2 font-bold uppercase text-sm border-3 border-secondary transition-all',
            filter === status ? 'bg-secondary text-white' : 'bg-white hover:bg-gray-100',
          )}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
