'use client'

import * as React from 'react'

import { DayPicker, type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'

export interface CalendarProps {
  defaultMonth?: Date
  hideNavigation?: boolean
  mode?: 'range'
  month?: Date
  numberOfMonths?: number
  selected?: DateRange
  onMonthChange?: (month: Date) => void
  onSelect?: (range: DateRange | undefined) => void
  className?: string
}

const calendarClassNames = {
  root: 'date-range-calendar p-0',
  months: 'flex flex-row flex-nowrap gap-4',
  month: 'space-y-2',
  month_caption: 'flex justify-center font-bold text-sm uppercase tracking-wide text-foreground',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-9 rounded font-medium text-muted-foreground text-xs uppercase',
  weeks: 'flex flex-col gap-0.5',
  week: 'flex w-full',
  day: 'w-9 p-0.5 text-center text-sm',
  day_button:
    'h-8 w-8 rounded-md border-2 border-transparent font-medium transition-colors hover:border-secondary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  range_start:
    'rounded-l-md bg-primary text-primary-foreground [&_.rdp-day_button]:!border-2 [&_.rdp-day_button]:!border-secondary [&_.rdp-day_button]:!bg-primary [&_.rdp-day_button]:!text-primary-foreground',
  range_middle:
    'bg-primary/20 [&_.rdp-day_button]:!border-0 [&_.rdp-day_button]:!bg-transparent [&_.rdp-day_button]:!text-foreground',
  range_end:
    'rounded-r-md bg-primary text-primary-foreground [&_.rdp-day_button]:!border-2 [&_.rdp-day_button]:!border-secondary [&_.rdp-day_button]:!bg-primary [&_.rdp-day_button]:!text-primary-foreground',
  selected:
    '[&_.rdp-day_button]:!border-2 [&_.rdp-day_button]:!border-secondary [&_.rdp-day_button]:!bg-primary [&_.rdp-day_button]:!text-primary-foreground',
  today: '[&_.rdp-day_button]:!ring-2 [&_.rdp-day_button]:!ring-primary [&_.rdp-day_button]:!ring-offset-2',
  outside: 'text-muted-foreground opacity-60',
  disabled: 'opacity-50',
  hidden: 'invisible',
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      defaultMonth,
      hideNavigation,
      mode = 'range',
      month,
      numberOfMonths = 1,
      selected,
      onMonthChange,
      onSelect,
      className,
    },
    _ref,
  ) => {
    return (
      <DayPicker
        className={cn(
          '[&_.rdp-months]:flex [&_.rdp-months]:flex-row [&_.rdp-months]:flex-nowrap [&_.rdp-months]:gap-4',
          className,
        )}
        classNames={calendarClassNames}
        defaultMonth={defaultMonth}
        mode={mode}
        month={month}
        numberOfMonths={numberOfMonths}
        selected={selected}
        onMonthChange={onMonthChange}
        onSelect={onSelect}
        components={
          hideNavigation
            ? {
                Nav: () => <></>,
                Chevron: () => <></>,
              }
            : undefined
        }
      />
    )
  },
)
Calendar.displayName = 'Calendar'

export default Calendar
