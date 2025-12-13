'use client'

import { useState } from 'react'

import { CompleteTaskModal } from '@/features/tasks/components/complete-task-modal'
import { CreateTaskModal } from '@/features/tasks/components/create-task-modal'
import { TaskList } from '@/features/tasks/components/task-list'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'
import { Plus } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function TasksPage() {
  const { tasks, scheduleBlocks, goals, isLoading, statusFilter, setStatusFilter } = useTasks()

  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const completeTaskMutation = useCompleteTaskMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)

  const createTask = async (form: CreateTaskForm) => {
    try {
      await createTaskMutation.mutateAsync(form)
      return true
    } catch {
      return false
    }
  }

  const updateTask = async (taskId: string, form: CreateTaskForm & { status?: TaskStatus }) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, data: form })
      return true
    } catch {
      return false
    }
  }

  const completeTask = async (taskId: string, minutes: number, notes?: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId, minutes, notes })
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Tasks</h1>
          <p className="font-mono uppercase text-gray-600">
            Link tasks to schedule blocks and goals. Completing logs time automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? '' : (value as TaskStatus))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => setShowCreate(true)} className="btn-brutal flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card-brutal flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
        </div>
      ) : (
        <TaskList tasks={tasks} onComplete={setCompletingTask} onEdit={setEditingTask} />
      )}

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTask}
        scheduleBlocks={scheduleBlocks}
        goals={goals}
      />

      <CreateTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={async (form) => {
          if (editingTask) {
            const success = await updateTask(editingTask.id, form)
            if (success) {
              setEditingTask(null)
            }
            return success
          }
          return false
        }}
        scheduleBlocks={scheduleBlocks}
        goals={goals}
        task={editingTask}
      />

      <CompleteTaskModal task={completingTask} onClose={() => setCompletingTask(null)} onConfirm={completeTask} />
    </div>
  )
}
