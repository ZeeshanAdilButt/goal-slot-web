'use client'

import { useMemo, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { ScheduleBlockDetailDialog } from '@/features/schedule/components/schedule-block-detail-dialog'
import { ScheduleBlockModal } from '@/features/schedule/components/schedule-block-modal'
import { ScheduleGrid } from '@/features/schedule/components/schedule-grid/schedule-grid'
import { useDeleteScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useHasProAccess } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

export function SchedulePage() {
  const [showModal, setShowModal] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [detailBlock, setDetailBlock] = useState<ScheduleBlock | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [presetTimes, setPresetTimes] = useState<{ startTime: string; endTime: string } | null>(null)
  const [draftKey, setDraftKey] = useState(0)
  const hasProAccess = useHasProAccess()
  const { data: weekSchedule = {} as WeekSchedule, isPending: isSchedulePending } = useWeeklySchedule()
  const { data: categories = [] } = useCategoriesQuery()
  const { mutateAsync: deleteBlock } = useDeleteScheduleBlock()
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
          <Button onClick={() => handleAddBlock(1)} variant="brand">
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        }
      />

      {!hasProAccess && totalBlocks >= 5 && (
        <GlassCard className="bg-yellow-50 border-yellow-200">
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
