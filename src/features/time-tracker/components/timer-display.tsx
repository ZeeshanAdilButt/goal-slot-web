import { cn } from '@/lib/utils'

interface TimerDisplayProps {
  elapsedTime: number
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
}

const STATE_META: Record<
  TimerDisplayProps['timerState'],
  { label: string; pillClass: string; dotClass: string }
> = {
  STOPPED: {
    label: 'Ready to start',
    pillClass: 'border-zinc-200 bg-zinc-50 text-zinc-600',
    dotClass: 'bg-zinc-400',
  },
  RUNNING: {
    label: 'Tracking',
    pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500 animate-pulse',
  },
  PAUSED: {
    label: 'Paused',
    pillClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  },
}

const DIGIT_STYLE: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", Consolas, "Courier New", monospace',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1',
}

export function TimerDisplay({ elapsedTime, timerState }: TimerDisplayProps) {
  const hrs = Math.floor(elapsedTime / 3600)
  const mins = Math.floor((elapsedTime % 3600) / 60)
  const secs = elapsedTime % 60
  const meta = STATE_META[timerState]
  const isRunning = timerState === 'RUNNING'

  return (
    <div className="mb-4 flex flex-col items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider',
          meta.pillClass,
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} aria-hidden />
        {meta.label}
      </span>

      <div
        className={cn(
          'text-5xl font-medium leading-none tracking-tight text-zinc-900 sm:text-6xl',
          isRunning && 'text-zinc-900',
        )}
        style={DIGIT_STYLE}
      >
        <span>{hrs.toString().padStart(2, '0')}</span>
        <span className="mx-0.5 text-zinc-300">:</span>
        <span>{mins.toString().padStart(2, '0')}</span>
        <span className="mx-0.5 text-zinc-300">:</span>
        <span className="text-zinc-500">{secs.toString().padStart(2, '0')}</span>
      </div>
    </div>
  )
}
