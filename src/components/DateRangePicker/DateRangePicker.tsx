'use client'

import React from 'react'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import DateRangePickerPanel from '@/components/DateRangePicker/DateRangePickerPanel'
import {
  createCompareRangeFromPrimary,
  createRangeFromValue,
  createValueFromRange,
  formatDisplayDate,
  getPresetRange,
  InternalRange,
  PRESETS,
  rangesAreEqual,
} from '@/components/DateRangePicker/helpers'
import type { DateRangePickerProps } from '@/components/DateRangePicker/types'

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  compareValue,
  onCompareChange,
  allowClearing = false,
  showCompare = false,
  align = 'end',
  locale = 'en-US',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [range, setRange] = React.useState<InternalRange>(() => createRangeFromValue(value))
  const [rangeCompare, setRangeCompare] = React.useState<InternalRange | undefined>(() =>
    showCompare && compareValue ? createRangeFromValue(compareValue) : undefined,
  )
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>()
  const [isSmallScreen, setIsSmallScreen] = React.useState(false)
  const [shouldResetOnClose, setShouldResetOnClose] = React.useState(true)
  const [openedRange, setOpenedRange] = React.useState<InternalRange>({ from: undefined, to: undefined })
  const [openedCompare, setOpenedCompare] = React.useState<InternalRange | undefined>(undefined)

  const syncFromProps = React.useCallback(() => {
    setRange(createRangeFromValue(value))
    setRangeCompare(showCompare && compareValue ? createRangeFromValue(compareValue) : undefined)
  }, [value, compareValue, showCompare])

  React.useEffect(() => {
    if (!isOpen) syncFromProps()
  }, [syncFromProps, isOpen])

  React.useEffect(() => {
    const updateScreen = () => setIsSmallScreen(window.innerWidth < 960)
    updateScreen()
    window.addEventListener('resize', updateScreen)
    return () => window.removeEventListener('resize', updateScreen)
  }, [])

  React.useEffect(() => {
    const match = PRESETS.find((preset) => rangesAreEqual(range, getPresetRange(preset.name)))
    setSelectedPreset(match?.name)
  }, [range])

  React.useEffect(() => {
    if (isOpen) {
      setOpenedRange(createRangeFromValue(value))
      setOpenedCompare(showCompare && compareValue ? createRangeFromValue(compareValue) : undefined)
    }
  }, [isOpen, value, compareValue, showCompare])

  const resetValues = () => {
    setRange(openedRange)
    setRangeCompare(
      showCompare ? (openedCompare ?? (compareValue ? createRangeFromValue(compareValue) : undefined)) : undefined,
    )
  }

  const applyChanges = () => {
    onChange(createValueFromRange(range) ?? { from: undefined, to: undefined })
    if (showCompare && onCompareChange) {
      onCompareChange(createValueFromRange(rangeCompare))
    }
    setShouldResetOnClose(false)
    setIsOpen(false)
  }

  const clearValues = () => {
    setRange({ from: undefined, to: undefined })
    setRangeCompare(undefined)
    onChange({ from: undefined, to: undefined })
    if (showCompare && onCompareChange) onCompareChange(undefined)
    setShouldResetOnClose(false)
    setIsOpen(false)
  }

  const hasChanges = !rangesAreEqual(range, openedRange) || !rangesAreEqual(rangeCompare, openedCompare)

  const defaultMonth = React.useMemo(() => {
    const target = range.to ?? range.from ?? new Date()
    return isSmallScreen ? target : new Date(target.getFullYear(), target.getMonth() - 1, 1)
  }, [range, isSmallScreen])

  const buttonLabel = range.from
    ? `${formatDisplayDate(range.from, locale)}${range.to ? ` - ${formatDisplayDate(range.to, locale)}` : ''}`
    : 'Select date range'

  return (
    <Popover
      modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && shouldResetOnClose) {
          resetValues()
        }
        setShouldResetOnClose(true)
        setIsOpen(open)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          className="inline-flex w-full min-w-0 justify-between gap-2 px-3 py-1.5 text-sm sm:w-auto sm:min-w-[14rem]"
          size="sm"
          variant="outline"
        >
          <div className="text-left">
            <p
              className={cn(
                'text-sm font-medium',
                range.from ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400',
              )}
            >
              {buttonLabel}
            </p>
            {rangeCompare?.from && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                vs. {formatDisplayDate(rangeCompare.from, locale)}
                {rangeCompare.to ? ` - ${formatDisplayDate(rangeCompare.to, locale)}` : ''}
              </p>
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] p-0 sm:w-auto sm:max-w-none"
        sideOffset={8}
      >
        <DateRangePickerPanel
          allowClearing={allowClearing}
          defaultMonth={defaultMonth}
          hasChanges={hasChanges}
          isSmallScreen={isSmallScreen}
          locale={locale}
          range={range}
          rangeCompare={rangeCompare}
          selectedPreset={selectedPreset}
          showCompare={showCompare}
          value={value}
          onApply={applyChanges}
          onCancel={() => {
            resetValues()
            setIsOpen(false)
          }}
          onClear={clearValues}
          onPresetSelect={(preset) => {
            setRange(getPresetRange(preset))
            if (rangeCompare) {
              setRangeCompare(createCompareRangeFromPrimary(getPresetRange(preset)))
            }
          }}
          onRangeChange={setRange}
          onRangeCompareChange={setRangeCompare}
        />
      </PopoverContent>
    </Popover>
  )
}

DateRangePicker.displayName = 'DateRangePicker'

export default DateRangePicker
