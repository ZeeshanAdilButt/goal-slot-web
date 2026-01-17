import { Calendar, ChevronDown, Clock, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type FilterVariant = 'inline' | 'stacked'

interface TasksAdvancedFiltersProps {
  dueDateFilter: string
  setDueDateFilter: (value: string) => void
  durationFilter: string
  setDurationFilter: (value: string) => void
  customDateStart: string
  setCustomDateStart: (value: string) => void
  customDateEnd: string
  setCustomDateEnd: (value: string) => void
  customDurationMin: number | ''
  setCustomDurationMin: (value: number | '') => void
  customDurationMax: number | ''
  setCustomDurationMax: (value: number | '') => void
  showReset?: boolean
  onReset?: () => void
  variant?: FilterVariant
}

export function TasksAdvancedFilters({
  dueDateFilter,
  setDueDateFilter,
  durationFilter,
  setDurationFilter,
  customDateStart,
  setCustomDateStart,
  customDateEnd,
  setCustomDateEnd,
  customDurationMin,
  setCustomDurationMin,
  customDurationMax,
  setCustomDurationMax,
  showReset = false,
  onReset,
  variant = 'inline',
}: TasksAdvancedFiltersProps) {
  const isStacked = variant === 'stacked'
  const dateTriggerClassName = isStacked
    ? 'flex h-10 w-full items-center justify-between rounded-sm border-2 border-secondary bg-white px-3 text-xs font-bold uppercase shadow-brutal-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
    : 'flex h-8 w-[130px] items-center justify-between rounded-sm border-2 border-secondary bg-white px-3 text-[10px] font-bold uppercase shadow-brutal-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
  const durationTriggerClassName = isStacked
    ? 'flex h-10 w-full items-center justify-between rounded-sm border-2 border-secondary bg-white px-3 text-xs font-bold uppercase shadow-brutal-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
    : 'flex h-8 w-[140px] items-center justify-between rounded-sm border-2 border-secondary bg-white px-3 text-[10px] font-bold uppercase shadow-brutal-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
  const iconSizeClassName = isStacked ? 'h-4 w-4' : 'h-3 w-3'
  const chevronClassName = isStacked ? 'h-4 w-4' : 'h-3 w-3'

  return (
    <div className={isStacked ? 'space-y-4' : 'flex flex-wrap items-center gap-2 pb-1 sm:pb-0'}>
      {isStacked ? <div className="text-xs font-bold uppercase text-secondary">Date filter</div> : null}
      <Popover>
        <PopoverTrigger asChild>
          <button className={dateTriggerClassName}>
            <div className="flex items-center gap-2 overflow-hidden">
              <Calendar className={cn(iconSizeClassName, 'flex-shrink-0')} />
              <span className="truncate">
                {dueDateFilter === 'all'
                  ? 'Any Date'
                  : dueDateFilter === 'custom'
                    ? 'Custom'
                    : dueDateFilter === 'week'
                      ? 'This Week'
                      : dueDateFilter === 'next_week'
                        ? 'Next Week'
                        : dueDateFilter.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className={cn(chevronClassName, 'flex-shrink-0 opacity-50')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 border-2 border-secondary p-3" align="start">
          <div className="space-y-3">
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Any Date' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'week', label: 'This Week' },
                { value: 'next_week', label: 'Next Week' },
                { value: 'no_date', label: 'No Date' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDueDateFilter(option.value)
                    if (option.value !== 'custom') {
                      setCustomDateStart('')
                      setCustomDateEnd('')
                    }
                  }}
                  className={`w-full rounded-sm px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                    dueDateFilter === option.value ? 'bg-secondary text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <Label className="text-xs font-semibold uppercase text-gray-600">Custom Range</Label>
              <div className="mt-2 space-y-2">
                <div>
                  <Label className="text-[10px] text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => {
                      setCustomDateStart(e.target.value)
                      if (e.target.value) setDueDateFilter('custom')
                    }}
                    className="h-8 border-2 border-secondary text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => {
                      setCustomDateEnd(e.target.value)
                      if (e.target.value) setDueDateFilter('custom')
                    }}
                    className="h-8 border-2 border-secondary text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {isStacked ? <div className="text-xs font-bold uppercase text-secondary">Duration filter</div> : null}
      <Popover>
        <PopoverTrigger asChild>
          <button className={durationTriggerClassName}>
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className={cn(iconSizeClassName, 'flex-shrink-0')} />
              <span className="truncate">
                {durationFilter === 'all'
                  ? 'Any Duration'
                  : durationFilter === 'custom'
                    ? customDurationMin !== '' || customDurationMax !== ''
                      ? `${customDurationMin || 0}-${customDurationMax || '∞'}m`
                      : 'Custom'
                    : durationFilter.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className={cn(chevronClassName, 'flex-shrink-0 opacity-50')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 border-2 border-secondary p-3" align="start">
          <div className="space-y-3">
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Any Duration' },
                { value: 'short', label: 'Short (<30m)' },
                { value: 'medium', label: 'Medium (30m-2h)' },
                { value: 'long', label: 'Long (>2h)' },
                { value: 'no_estimate', label: 'No Estimate' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDurationFilter(option.value)
                    if (option.value !== 'custom') {
                      setCustomDurationMin('')
                      setCustomDurationMax('')
                    }
                  }}
                  className={`w-full rounded-sm px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                    durationFilter === option.value ? 'bg-secondary text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <Label className="text-xs font-semibold uppercase text-gray-600">Custom Range (minutes)</Label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Min</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={customDurationMin}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      setCustomDurationMin(val)
                      if (val !== '') setDurationFilter('custom')
                    }}
                    className="h-8 border-2 border-secondary text-xs"
                  />
                </div>
                <span className="mt-4 text-gray-400">–</span>
                <div className="flex-1">
                  <Label className="text-[10px] text-gray-500">Max</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={customDurationMax}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      setCustomDurationMax(val)
                      if (val !== '') setDurationFilter('custom')
                    }}
                    className="h-8 border-2 border-secondary text-xs"
                  />
                </div>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Common: 15, 30, 60, 90, 120 minutes</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {showReset ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className={isStacked ? 'h-10 w-full' : 'h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600'}
        >
          {isStacked ? 'Clear filters' : <X className="h-4 w-4" />}
        </Button>
      ) : null}
    </div>
  )
}
