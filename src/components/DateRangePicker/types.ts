export interface DateRangeValue {
  from?: string
  to?: string
}

export interface DateRangePickerProps {
  idPrefix?: string
  value: DateRangeValue
  onChange: (nextValue: DateRangeValue) => void
  compareValue?: DateRangeValue
  onCompareChange?: (next?: DateRangeValue) => void
  allowClearing?: boolean
  showCompare?: boolean
  align?: 'start' | 'center' | 'end'
  locale?: string
}
