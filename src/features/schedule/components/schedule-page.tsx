'use client'

import { useState } from 'react'

import { useDeleteScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useHasProAccess } from '@/lib/store'
import { SCHEDULE_CATEGORIES } from '@/lib/utils'

import { ScheduleBlockModal } from './schedule-block-modal'
import { ScheduleGrid } from './schedule-grid/schedule-grid'

export function SchedulePage() {
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [presetTimes, setPresetTimes] = useState<{ startTime: string; endTime: string } | null>(null)
  const [draftKey, setDraftKey] = useState(0) // Reset the draft when modal is closed (to clear any draft blocks).
  const hasProAccess = useHasProAccess()
  const { data: weekSchedule = {} as WeekSchedule, isPending: isSchedulePending } = useWeeklySchedule()
  const { mutateAsync: deleteBlock } = useDeleteScheduleBlock()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule block?')) return

    try {
      await deleteBlock(id)
      toast.success('Block deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleEdit = (block: ScheduleBlock) => {
    setEditingBlock(block)
    setSelectedDay(block.dayOfWeek)
    setPresetTimes(null)
    setShowModal(true)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Schedule</h1>
          <p className="font-mono uppercase text-gray-600">Plan your weekly time blocks</p>
        </div>

        <button onClick={() => handleAddBlock(1)} className="btn-brutal flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Block
        </button>
      </div>

      {!hasProAccess && totalBlocks >= 5 && (
        <div className="card-brutal-colored bg-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold uppercase">Schedule limit reached (5 blocks)</p>
              <p className="font-mono text-sm">Upgrade to Pro for unlimited schedule blocks</p>
            </div>
            <a href="/dashboard/settings#billing" className="btn-brutal-dark">
              Upgrade
            </a>
          </div>
        </div>
      )}

      <div className="card-brutal overflow-hidden p-0">
        <ScheduleGrid
          weekSchedule={weekSchedule}
          isPending={isSchedulePending}
          onAddBlock={handleAddBlock}
          onEdit={handleEdit}
          onDelete={handleDelete}
          draftKey={draftKey}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {SCHEDULE_CATEGORIES.map((cat) => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className={`h-4 w-4 border-2 border-secondary ${cat.color}`} />
            <span className="font-mono text-sm uppercase">{cat.label}</span>
          </div>
        ))}
      </div>

      <ScheduleBlockModal
        isOpen={showModal}
        onClose={handleCloseModal}
        block={editingBlock}
        dayOfWeek={selectedDay}
        presetTimes={presetTimes}
      />
    </div>
  )
}
