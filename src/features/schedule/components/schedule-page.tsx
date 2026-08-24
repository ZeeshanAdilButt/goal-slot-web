'use client'

import { useEffect, useMemo, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { ClearScheduleButton } from '@/features/schedule/components/clear-schedule-button'
import { ScheduleBlockDetailDialog } from '@/features/schedule/components/schedule-block-detail-dialog'
import { ScheduleBlockModal } from '@/features/schedule/components/schedule-block-modal'
import { ScheduleGrid } from '@/features/schedule/components/schedule-grid/schedule-grid'
import { useDeleteScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import { Clock, Eye, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { formatTime12h } from '@/lib/utils'
import { useHasProAccess } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { GoalFlagIcon } from '@/components/icons/goal-flag-icon'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

function fmtShort(time: string): string {
  return formatTime12h(time).replace(':00 ', ' ')
}

export function SchedulePage() {
  const [showModal, setShowModal] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [detailBlock, setDetailBlock] = useState<ScheduleBlock | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [presetTimes, setPresetTimes] = useState<{ startTime: string; endTime: string } | null>(null)
  const [draftKey, setDraftKey] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const hasProAccess = useHasProAccess()
  const { data: weekSchedule = {} as WeekSchedule, isPending: isSchedulePending } = useWeeklySchedule()
  const { data: categories = [] } = useCategoriesQuery()
  const { mutateAsync: deleteBlock } = useDeleteScheduleBlock()

  // Ticker so the active-block banner reflects the current minute without
  // requiring a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const activeBlock = useMemo(
    () => findScheduleBlockForDateTime(weekSchedule, now),
    [weekSchedule, now],
  )

  const scrollToBlock = (blockId: string) => {
    const el = document.getElementById(`schedule-block-${blockId}`)
    if (!el) return
    // Scroll vertically only — horizontal centering would push empty
    // days (e.g. Sunday with no blocks) under the left-hand time-
    // labels column and hide it. Vertical scroll is enough since the
    // block's column is already in view.
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    // Flash a brand-yellow ring on the block for a couple of seconds so
    // the eye lands on it after the scroll finishes.
    el.setAttribute('data-flash', 'true')
    setTimeout(() => el.removeAttribute('data-flash'), 2200)
  }
  const seriesBlockCount = useMemo(() => {
    if (!editingBlock) return 0
    const allBlocks = Object.values(weekSchedule || {}).flat()
    return allBlocks.filter((block) => block.seriesId === editingBlock.seriesId).length
  }, [editingBlock, weekSchedule])

  const handleEdit = (block: ScheduleBlock) => {
    setEditingBlock(block)
    setSelectedDay(block.dayOfWeek)
    setPresetTimes(null)
    setShowModal(true)
  }

  const handleViewDetail = (block: ScheduleBlock) => {
    setDetailBlock(block)
    setShowDetailDialog(true)
  }

  const handleEditFromDetail = () => {
    if (detailBlock) {
      handleEdit(detailBlock)
    }
  }

  const handleDeleteFromDetail = async () => {
    if (detailBlock) {
      try {
        await deleteBlock(detailBlock.id)
        toast.success('Block deleted')
      } catch (error) {
        toast.error('Failed to delete')
      }
    }
  }

  const handleAddBlock = (dayOfWeek: number, preset?: { startTime: string; endTime: string }) => {
    setSelectedDay(dayOfWeek)
    setEditingBlock(null)
    setPresetTimes(preset ?? null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBlock(null)
    setSelectedDay(null)
    setPresetTimes(null)
    setDraftKey((prev) => prev + 1)
  }

  const totalBlocks = Object.values(weekSchedule).flat().length
  return (
    <PageShell className="isolate">
      <PageHeader
        eyebrow="Plan your week"
        title="Schedule"
        description="Plan your weekly time blocks"
        actions={
          <div className="flex items-center gap-1.5">
            <ClearScheduleButton totalBlocks={totalBlocks} />
            <Button onClick={() => handleAddBlock(1)} variant="brand" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Block
            </Button>
          </div>
        }
      />

      {/* Active block call-out — mirrors the FocusNowBar so the schedule
          page itself surfaces what's happening right now. Click to view
          the block detail dialog. Hidden during free time. */}
      {activeBlock && (
        <div className="relative overflow-hidden rounded-xl border border-[#f2cc0d]/40 bg-gradient-to-r from-[#fffbea] via-[#fffbea] to-[#fff7d1] px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex shrink-0 items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2cc0d] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7307]">
                Active now
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <span className="truncate text-sm font-bold text-zinc-900">{activeBlock.title}</span>
              {activeBlock.goal?.title && (
                <span className="inline-flex items-center gap-1 truncate text-xs text-zinc-600">
                  <GoalFlagIcon className="h-3 w-3 shrink-0 text-[#8a7307]" />
                  <span className="truncate">{activeBlock.goal.title}</span>
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-[#f2cc0d]/40 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                <Clock className="h-3 w-3 text-[#8a7307]" />
                {fmtShort(activeBlock.startTime)} - {fmtShort(activeBlock.endTime)}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => scrollToBlock(activeBlock.id)}
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasProAccess && totalBlocks >= 5 && (
        <GlassCard className="border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">Schedule limit reached (5 blocks)</p>
              <p className="text-sm text-zinc-600">Upgrade to Pro for unlimited schedule blocks</p>
            </div>
            <Button asChild variant="default">
              <a href="/dashboard/settings#billing">Upgrade</a>
            </Button>
          </div>
        </GlassCard>
      )}

      <GlassCard padded={false} className="overflow-hidden p-0">
        <ScheduleGrid
          weekSchedule={weekSchedule}
          isPending={isSchedulePending}
          onAddBlock={handleAddBlock}
          onEdit={handleEdit}
          onViewDetail={handleViewDetail}
          draftKey={draftKey}
        />
      </GlassCard>

      <div className="flex flex-wrap gap-4">
        {categories.map((cat) => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-zinc-200" style={{ backgroundColor: cat.color }} />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{cat.name}</span>
          </div>
        ))}
      </div>

      <ScheduleBlockModal
        isOpen={showModal}
        onClose={handleCloseModal}
        block={editingBlock}
        dayOfWeek={selectedDay}
        presetTimes={presetTimes}
        seriesBlockCount={seriesBlockCount}
      />

      <ScheduleBlockDetailDialog
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false)
          setDetailBlock(null)
        }}
        block={detailBlock}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
    </PageShell>
  )
}
