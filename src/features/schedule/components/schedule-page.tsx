'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useHasProAccess } from '@/lib/store'
import { SCHEDULE_CATEGORIES } from '@/lib/utils'

import { ScheduleGrid } from './schedule-grid'
import { ScheduleBlockModal } from './schedule-block-modal'
import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { useDeleteScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'

export function SchedulePage() {
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
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
    setShowModal(true)
  }

  const handleAddBlock = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek)
    setEditingBlock(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBlock(null)
    setSelectedDay(null)
  }

  const totalBlocks = Object.values(weekSchedule).flat().length
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Schedule</h1>
          <p className="font-mono text-gray-600 uppercase">Plan your weekly time blocks</p>
        </div>

        <button
          onClick={() => handleAddBlock(1)}
          className="btn-brutal flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
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

      <div className="card-brutal p-0 overflow-hidden relative">
        <ScheduleGrid
          weekSchedule={weekSchedule}
          isPending={isSchedulePending}
          onAddBlock={handleAddBlock}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {SCHEDULE_CATEGORIES.map((cat) => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className={`w-4 h-4 border-2 border-secondary ${cat.color}`} />
            <span className="font-mono text-sm uppercase">{cat.label}</span>
          </div>
        ))}
      </div>

      <ScheduleBlockModal
        isOpen={showModal}
        onClose={handleCloseModal}
        block={editingBlock}
        dayOfWeek={selectedDay}
      />
    </div>
  )
}
