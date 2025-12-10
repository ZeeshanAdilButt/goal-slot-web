import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

import { DAYS_OF_WEEK_FULL, getCategoryColor, timeToMinutes } from '@/lib/utils'
import { LoadingSpinner } from '@/components/loading-spinner'

import { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'

type ScheduleGridProps = {
  weekSchedule: WeekSchedule
  isPending: boolean
  onAddBlock: (dayOfWeek: number) => void
  onEdit: (block: ScheduleBlock) => void
  onDelete: (id: string) => void
}

export function ScheduleGrid({
  weekSchedule,
  isPending,
  onAddBlock,
  onEdit,
  onDelete,
}: ScheduleGridProps) {
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6)

  if (isPending) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-8 border-b-3 border-secondary">
          <div className="bg-secondary text-white p-4 font-bold uppercase text-center">
            Time
          </div>
          {DAYS_OF_WEEK_FULL.map((day, i) => (
            <div
              key={day}
              className="bg-secondary text-white p-4 font-bold uppercase text-center border-l-2 border-gray-700"
            >
              {day.slice(0, 3)}
              <button
                onClick={() => onAddBlock(i)}
                className="ml-2 w-6 h-6 inline-flex items-center justify-center bg-primary text-secondary text-xs hover:scale-110 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-2 text-center font-mono text-sm bg-gray-50 border-r-3 border-secondary">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
              const blocks = (weekSchedule[dayOfWeek] || []).filter((block) => {
                const startHour = parseInt(block.startTime.split(':')[0])
                return startHour === hour
              })

              return (
                <div key={dayOfWeek} className="min-h-[60px] p-1 border-l border-gray-200 relative">
                  {blocks.map((block) => {
                    const startMins = timeToMinutes(block.startTime)
                    const endMins = timeToMinutes(block.endTime)
                    const durationHours = (endMins - startMins) / 60
                    const height = Math.max(durationHours * 60, 58)

                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-1 right-1 border-2 border-secondary shadow-brutal-sm p-2 cursor-pointer group z-10"
                        style={{
                          backgroundColor: block.color || getCategoryColor(block.category),
                          height: `${height}px`,
                        }}
                        onClick={() => onEdit(block)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-xs uppercase truncate pr-6">
                            {block.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(block.id)
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-white border border-secondary opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-mono text-xs">
                          {block.startTime} - {block.endTime}
                        </div>
                        {block.goal && (
                          <div className="mt-1 text-xs font-mono truncate">
                            → {block.goal.title}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
