'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { parseTimeInput } from '@/features/schedule/utils/time-input'
import { Clock } from 'lucide-react'

import { cn, formatTime12h, timeOptionsIncluding } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type TimeFieldProps = {
  label: string
  /** "HH:mm" */
  value: string
  onCommit: (value: string) => void
  /** Quick-pick times at or before this "HH:mm" are disabled (used by the end field). */
  disableUpTo?: string
  invalid?: boolean
  describedBy?: string
}

/**
 * A typed time field with a quick-pick list. The text is free-form ("7",
 * "7:30pm", "1930"); on blur or Enter it is parsed and committed, and text
 * that cannot be read reverts to the last good time with a small message.
 */
export function TimeField({ label, value, onCommit, disableUpTo, invalid, describedBy }: TimeFieldProps) {
  const inputId = useId()
  const messageId = useId()
  const [text, setText] = useState(() => formatTime12h(value))
  const [message, setMessage] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  // Follow the committed value (quick picks, duration chips, shifting the end
  // along with the start). Typing alone never changes `value`; it only does
  // once the text is committed on blur or Enter.
  useEffect(() => {
    setText(formatTime12h(value))
    setMessage('')
  }, [value])

  useEffect(() => {
    if (pickerOpen) selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [pickerOpen])

  const commit = () => {
    const parsed = parseTimeInput(text)
    if (parsed) {
      setMessage('')
      setText(formatTime12h(parsed))
      if (parsed !== value) onCommit(parsed)
      return
    }
    const typed = text.trim()
    setMessage(typed === '' ? 'Enter a time, for example 7:30pm.' : `Could not read "${typed}". Try 7:30pm or 19:30.`)
    setText(formatTime12h(value))
  }

  const options = timeOptionsIncluding(value)
  const disableUpToValue = disableUpTo ?? null

  return (
    <div>
      <Label htmlFor={inputId} className="mb-1.5 block text-[10px] tracking-wider">
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <Input
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (message) setMessage('')
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Commit what was typed instead of submitting the form with the
              // previous value; a second Enter then saves.
              e.preventDefault()
              commit()
            }
          }}
          aria-invalid={invalid || Boolean(message) || undefined}
          aria-describedby={[message ? messageId : null, describedBy].filter(Boolean).join(' ') || undefined}
          className={cn('h-11 min-w-0 flex-1', (invalid || message) && 'border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-400')}
        />
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Pick ${label.toLowerCase()} from a list`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="max-h-64 w-40 overflow-y-auto p-1"
            // The dialog underneath locks scrolling for anything rendered outside
            // it; this keeps the wheel and touch scroll working in the list.
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <ul role="listbox" aria-label={`${label} quick picks`}>
              {options.map((opt) => {
                const selected = opt.value === value
                const disabled = disableUpToValue !== null && opt.value <= disableUpToValue
                return (
                  <li key={opt.value} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      ref={selected ? selectedRef : undefined}
                      disabled={disabled}
                      onClick={() => {
                        onCommit(opt.value)
                        setPickerOpen(false)
                      }}
                      className={cn(
                        'flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]',
                        selected ? 'bg-[#f2cc0d] font-semibold text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100',
                        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
      {message && (
        <p id={messageId} role="alert" className="mt-1 text-[11px] text-rose-600">
          {message}
        </p>
      )}
    </div>
  )
}
