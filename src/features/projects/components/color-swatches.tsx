import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

import { PROJECT_COLORS } from '../utils/types'

const COLOR_NAMES: Record<string, string> = {
  '#2563EB': 'Blue',
  '#B45309': 'Amber',
  '#059669': 'Green',
  '#7C3AED': 'Violet',
  '#DB2777': 'Pink',
  '#DC2626': 'Red',
  '#0891B2': 'Cyan',
  '#52525B': 'Gray',
}

interface ColorSwatchesProps {
  name: string
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

/** A radio group of project colors. Real radios, so arrow keys work. */
export function ColorSwatches({ name, value, onChange, disabled }: ColorSwatchesProps) {
  return (
    <fieldset className="m-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-700">Color</legend>
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((color) => {
          const checked = value.toUpperCase() === color
          return (
            <label
              key={color}
              className={cn(
                'relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-2 transition focus-within:ring-2 focus-within:ring-[#f2cc0d] focus-within:ring-offset-1',
                checked ? 'border-zinc-900' : 'border-transparent',
                disabled && 'cursor-not-allowed opacity-60',
              )}
              style={{ background: color }}
            >
              <input
                type="radio"
                name={name}
                value={color}
                checked={checked}
                onChange={() => onChange(color)}
                className="sr-only"
              />
              <span className="sr-only">{COLOR_NAMES[color] ?? color}</span>
              {checked ? <Check className="h-4 w-4 text-white" aria-hidden /> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
