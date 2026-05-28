'use client'

import {
  Angry,
  Battery,
  BatteryLow,
  Brain,
  Cloud,
  CloudFog,
  Coffee,
  Eye,
  Flame,
  Frown,
  type LucideIcon,
  Laugh,
  Meh,
  Smile,
  Target,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  EnergyGlyphIcon,
  FocusGlyphIcon,
  MoodGlyphIcon,
} from '@/components/icons/checkin-glyphs'

export type DialKey = 'mood' | 'energy' | 'focus'

interface DialMeta {
  label: string
  /** Five icons low -> high. Lucide so they render crisp at any size, no emoji. */
  icons: [LucideIcon, LucideIcon, LucideIcon, LucideIcon, LucideIcon]
}

/** Color ramp by value 1..5: bad red -> neutral amber -> great emerald. */
const VALUE_COLOR: Record<number, { fg: string; bgSel: string; ringSel: string }> = {
  1: { fg: 'text-rose-500', bgSel: 'bg-rose-50', ringSel: 'ring-rose-300' },
  2: { fg: 'text-orange-500', bgSel: 'bg-orange-50', ringSel: 'ring-orange-300' },
  3: { fg: 'text-amber-500', bgSel: 'bg-amber-50', ringSel: 'ring-amber-300' },
  4: { fg: 'text-emerald-500', bgSel: 'bg-emerald-50', ringSel: 'ring-emerald-300' },
  5: { fg: 'text-green-600', bgSel: 'bg-green-50', ringSel: 'ring-green-400' },
}

export const DIALS: Record<DialKey, DialMeta> = {
  mood: {
    label: 'Mood',
    icons: [Angry, Frown, Meh, Smile, Laugh],
  },
  energy: {
    label: 'Energy',
    icons: [BatteryLow, Battery, Coffee, Zap, Flame],
  },
  focus: {
    label: 'Focus',
    icons: [CloudFog, Cloud, Eye, Target, Brain],
  },
}

interface ScaleRowProps {
  dial: DialKey
  value: number | null
  onChange: (v: number) => void
}

export function ScaleRow({ dial, value, onChange }: ScaleRowProps) {
  const { label, icons } = DIALS[dial]
  return (
    <div>
      <div className="mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {icons.map((Icon, idx) => {
          const n = idx + 1
          const selected = value === n
          const palette = VALUE_COLOR[n]
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${label} ${n} of 5`}
              className={cn(
                'inline-flex h-12 items-center justify-center rounded-lg transition-all',
                selected
                  ? cn(palette.bgSel, palette.ringSel, 'ring-2 scale-[1.06]')
                  : 'bg-transparent hover:bg-zinc-50 hover:scale-105',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  selected ? palette.fg : 'text-zinc-400',
                )}
                strokeWidth={selected ? 2.25 : 1.75}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Tiny inline render of a saved check-in (used in summary chips).
 * Custom on-brand SVG glyphs (face / bolt / bullseye) paired with the
 * 1–5 value tinted by the rose→green palette. Same visual language as
 * the FeatherPenIcon / GoalFlagIcon — not generic lucide swaps.
 */
export function CheckinSummaryIcons({
  mood,
  energy,
  focus,
  className,
}: {
  mood: number | null
  energy: number | null
  focus: number | null
  className?: string
}) {
  type Item = { Icon: React.ComponentType<{ className?: string }>; v: number | null; title: string }
  const items: Item[] = [
    { Icon: MoodGlyphIcon, v: mood, title: 'Mood' },
    { Icon: EnergyGlyphIcon, v: energy, title: 'Energy' },
    { Icon: FocusGlyphIcon, v: focus, title: 'Focus' },
  ]
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {items.map(({ Icon, v, title }, i) => {
        if (v == null) return null
        const palette = VALUE_COLOR[v]
        return (
          <span
            key={i}
            title={`${title}: ${v}/5`}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-full border border-zinc-200 bg-white pl-1 pr-1.5 text-[11px] font-bold tabular-nums',
              palette.fg,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{v}</span>
          </span>
        )
      })}
    </span>
  )
}
