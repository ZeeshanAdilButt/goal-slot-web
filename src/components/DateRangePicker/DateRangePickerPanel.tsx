import React from 'react'

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import AnimateChangeInHeight from '@/components/animate-change-in-height'
import Calendar from '@/components/DateRangePicker/Calendar'
import DateInput from '@/components/DateRangePicker/DateInput'
import {
  createCompareRangeFromPrimary,
  getPresetRange,
  InternalRange,
  PRESETS,
} from '@/components/DateRangePicker/helpers'
import type { DateRangeValue } from '@/components/DateRangePicker/types'

const isDateRange = (value?: Date | Date[] | DateRange): value is DateRange =>
  Boolean(value && typeof value === 'object' && 'from' in value)

interface DateRangePickerPanelProps {
  range: InternalRange
  rangeCompare?: InternalRange
  locale: string
  selectedPreset?: string
  isSmallScreen: boolean
  showCompare: boolean
  allowClearing: boolean
  hasChanges: boolean
  value: DateRangeValue
  defaultMonth: Date
  onRangeChange: (next: InternalRange) => void
  onRangeCompareChange: (next?: InternalRange) => void
  onPresetSelect: (preset: string) => void
  onClear: () => void
  onCancel: () => void
  onApply: () => void
}

const DateRangePickerPanel: React.FC<DateRangePickerPanelProps> = ({
  range,
  rangeCompare,
  locale,
  selectedPreset,
  isSmallScreen,
  showCompare,
  allowClearing,
  hasChanges,
  value,
  defaultMonth,
  onRangeChange,
  onRangeCompareChange,
  onPresetSelect,
  onClear,
  onCancel,
  onApply,
}) => {
  const [calendarMonth, setCalendarMonth] = React.useState(defaultMonth)

  React.useEffect(() => {
    setCalendarMonth(defaultMonth)
  }, [defaultMonth])

  const monthsToShift = isSmallScreen ? 1 : 2

  const changeMonthBy = React.useCallback((amount: number) => {
    setCalendarMonth((current) => {
      const next = new Date(current)
      next.setMonth(next.getMonth() + amount)
      return next
    })
  }, [])

  const showPreviousMonths = React.useCallback(() => {
    changeMonthBy(-monthsToShift)
  }, [changeMonthBy, monthsToShift])

  const showNextMonths = React.useCallback(() => {
    changeMonthBy(monthsToShift)
  }, [changeMonthBy, monthsToShift])

  return (
    <>
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-col space-y-5 border-b border-gray-100 p-3 dark:border-gray-800 sm:p-4 lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {showCompare && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={Boolean(rangeCompare)}
                  disabled={!range.from}
                  id="compare-toggle"
                  onCheckedChange={(checked: boolean) =>
                    onRangeCompareChange(checked ? createCompareRangeFromPrimary(range) : undefined)
                  }
                />
                <Label htmlFor="compare-toggle">Compare</Label>
              </div>
            )}
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:flex sm:flex-wrap sm:items-center">
                <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-2">
                  <DateInput
                    aria-label="From date"
                    className="w-full sm:w-36"
                    value={range.from}
                    onChange={(date: Date) => {
                      const nextTo = range.to && date > range.to ? date : range.to
                      onRangeChange({ from: date, to: nextTo })
                    }}
                  />
                  <span className="hidden text-gray-400 sm:inline">—</span>
                  <DateInput
                    aria-label="To date"
                    className="w-full sm:w-36"
                    value={range.to ?? range.from}
                    onChange={(date: Date) => {
                      const baseFrom = range.from ?? date
                      const nextFrom = range.from && date < range.from ? date : baseFrom
                      onRangeChange({ from: nextFrom, to: date })
                    }}
                  />
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 sm:ml-auto">
                  <Button
                    aria-label="Show previous months"
                    className="h-8 w-8 p-0"
                    variant="outline"
                    onClick={showPreviousMonths}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    aria-label="Show next months"
                    className="h-8 w-8 p-0"
                    variant="outline"
                    onClick={showNextMonths}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {rangeCompare && (
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  <DateInput
                    aria-label="Compare from date"
                    className="w-full sm:w-36"
                    value={rangeCompare.from}
                    onChange={(date: Date) => {
                      const nextTo = rangeCompare.to && date > rangeCompare.to ? date : rangeCompare.to
                      onRangeCompareChange({ from: date, to: nextTo })
                    }}
                  />
                  <span className="hidden text-gray-400 sm:inline">—</span>
                  <DateInput
                    aria-label="Compare to date"
                    className="w-full sm:w-36"
                    value={rangeCompare.to ?? rangeCompare.from}
                    onChange={(date: Date) => {
                      const baseFrom = rangeCompare.from ?? date
                      const nextFrom = rangeCompare.from && date < rangeCompare.from ? date : baseFrom
                      onRangeCompareChange({ from: nextFrom, to: date })
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          {isSmallScreen && (
            <Select
              value={selectedPreset}
              onValueChange={(preset: string) => {
                onPresetSelect(preset)
                if (rangeCompare) {
                  onRangeCompareChange(createCompareRangeFromPrimary(getPresetRange(preset)))
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Preset ranges" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AnimateChangeInHeight>
            <Calendar
              defaultMonth={defaultMonth}
              hideNavigation
              mode="range"
              month={calendarMonth}
              numberOfMonths={isSmallScreen ? 1 : 2}
              selected={range.from ? { from: range.from, to: range.to ?? range.from } : undefined}
              onMonthChange={setCalendarMonth}
              onSelect={(nextValue: DateRange | undefined) => {
                if (!isDateRange(nextValue)) return
                onRangeChange({
                  from: nextValue.from,
                  to: nextValue.to ?? nextValue.from,
                })
              }}
            />
          </AnimateChangeInHeight>
        </div>
        {!isSmallScreen && (
          <div className="flex flex-col gap-1 p-4">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                className={cn(
                  'justify-start text-sm',
                  selectedPreset === preset.name && 'pointer-events-none opacity-80',
                )}
                variant="ghost"
                onClick={() => {
                  onPresetSelect(preset.name)
                  if (showCompare && rangeCompare) {
                    onRangeCompareChange(createCompareRangeFromPrimary(getPresetRange(preset.name)))
                  }
                }}
              >
                <span className="mr-2 w-4 text-gray-500">
                  {selectedPreset === preset.name && <Check className="h-4 w-4" />}
                </span>
                {preset.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800 sm:px-4">
        {allowClearing && (
          <Button
            className="flex-1 sm:flex-none"
            disabled={!value.from && !value.to}
            size="sm"
            variant="ghost"
            onClick={onClear}
          >
            Clear
          </Button>
        )}
        <Button className="flex-1 sm:flex-none" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1 sm:flex-none" disabled={!hasChanges} size="sm" onClick={onApply}>
          Update
        </Button>
      </div>
    </>
  )
}

DateRangePickerPanel.displayName = 'DateRangePickerPanel'

export default DateRangePickerPanel
