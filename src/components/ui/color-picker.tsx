"use client"

import { useRef } from "react"

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  presets?: string[]
}

const DEFAULT_PRESETS = [
  '#FFD700', '#EC4899', '#3B82F6', '#22C55E',
  '#8B5CF6', '#F97316', '#EF4444', '#14B8A6',
  '#06B6D4', '#F59E0B', '#F43F5E', '#0EA5E9',
  '#A855F7', '#10B981', '#64748B', '#0F172A',
]

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedValue = value ? value.toUpperCase() : ""
  const normalizedPresets = presets.map((c) => c.toUpperCase())
  const isCustom = normalizedValue ? !normalizedPresets.includes(normalizedValue) : false

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
            normalizedValue === color.toUpperCase()
              ? "scale-110 ring-2 ring-zinc-900 ring-offset-1"
              : "border-zinc-300"
          }`}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-medium transition-all hover:scale-105 ${
          isCustom
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-transparent text-zinc-500"
        }`}
      >
        {isCustom && (
          <span
            className="h-2.5 w-2.5 rounded-full border border-white"
            style={{ backgroundColor: value }}
          />
        )}
        Custom
      </button>

      <input
        ref={inputRef}
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="sr-only"
        aria-label="Custom color"
      />
    </div>
  )
}
