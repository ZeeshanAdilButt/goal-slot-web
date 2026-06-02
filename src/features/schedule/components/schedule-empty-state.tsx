import { CalendarPlus } from 'lucide-react'

interface ScheduleEmptyStateProps {
  onAddBlock: () => void
}

export function ScheduleEmptyState({ onAddBlock }: ScheduleEmptyStateProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white/90 px-10 py-8 shadow-sm backdrop-blur-sm">
        <CalendarPlus className="h-10 w-10 text-zinc-400" />
        <div className="text-center">
          <p className="text-base font-bold text-zinc-900">Your week starts blank</p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Scheduling time against a goal keeps the Coach informed and your focus intentional.
          </p>
        </div>
        <button
          onClick={onAddBlock}
          className="inline-flex items-center gap-2 rounded-lg bg-[#f2cc0d] px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#e6c200]"
        >
          <CalendarPlus className="h-4 w-4" />
          Add your first block
        </button>
      </div>
    </div>
  )
}
