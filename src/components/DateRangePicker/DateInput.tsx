'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { parseDateValue, toDateString } from '@/components/DateRangePicker/helpers'

export interface DateInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value?: Date
  onChange?: (date: Date) => void
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(({ value, onChange, ...props }, ref) => {
  const valueStr = value ? toDateString(value) : ''
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseDateValue(e.target.value)
    if (next) onChange?.(next)
  }
  return <Input ref={ref} type="date" value={valueStr} onChange={handleChange} {...props} />
})
DateInput.displayName = 'DateInput'

export default DateInput
