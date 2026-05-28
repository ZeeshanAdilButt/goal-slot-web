'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface SearchableOption {
  value: string
  label: string
  /** Optional small caption shown under the label (e.g. "DEEP_WORK"). */
  hint?: string
  /** Optional 6-char hex color to render as a leading dot. */
  color?: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (next: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

/**
 * Type-to-filter dropdown built on Popover. No new deps (no cmdk yet).
 * Drop-in replacement for shadcn Select on long lists where the user
 * wants to type to narrow the choices (categories, goals, tasks, etc).
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No matches.',
  disabled = false,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q),
    )
  }, [options, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm transition-colors hover:border-zinc-300 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] disabled:cursor-not-allowed disabled:opacity-50',
              triggerClassName,
            )}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected?.color && (
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: selected.color }}
                />
              )}
              <span className={cn('truncate', !selected && 'text-zinc-400')}>
                {selected?.label ?? placeholder}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="z-50 w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <div className="border-b border-zinc-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-zinc-500">{emptyMessage}</li>
            ) : (
              filtered.map((option) => {
                const isSel = option.value === value
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-zinc-50',
                        isSel && 'bg-[#fff7d1]',
                      )}
                    >
                      {option.color && (
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: option.color }}
                        />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-zinc-900">{option.label}</span>
                        {option.hint && (
                          <span className="truncate text-[10px] text-zinc-400">
                            {option.hint}
                          </span>
                        )}
                      </span>
                      {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-[#8a7307]" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}
