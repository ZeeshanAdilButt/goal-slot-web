'use client'

import { Moon, Sun } from 'lucide-react'

import { useThemeStore } from '@/lib/use-theme'
import { cn } from '@/lib/utils'

export function SettingsAppearanceTab() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const options: { value: 'light' | 'dark'; label: string; description: string; icon: typeof Sun }[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright surfaces, dark text. Best for daytime.',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Deep zinc surfaces, brand-yellow accents. Easy on the eyes at night.',
      icon: Moon,
    },
  ]

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Theme</h2>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          Applies across the whole app. The journal page always renders in dark, regardless of this setting.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isActive = theme === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={isActive}
              className={cn(
                'group flex flex-col gap-2 rounded-lg border p-4 text-left transition-all',
                isActive
                  ? 'border-[#f2cc0d] bg-[#fffbea] ring-2 ring-[#f2cc0d]/40'
                  : 'border-zinc-200 bg-white hover:border-zinc-300',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-[#f2cc0d]">
                  <Icon className="h-4 w-4" />
                </span>
                {isActive && (
                  <span className="inline-flex h-5 items-center gap-1 rounded-full bg-zinc-900 px-2 text-[10px] font-semibold tracking-tight text-[#f2cc0d]">
                    Active
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900">{opt.label}</div>
                <div className="mt-0.5 text-[12px] text-zinc-500">{opt.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
