'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'

import { Calendar, CheckCircle2, Clock, Link2, Plus, Target } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { goalsApi, scheduleApi, tasksApi } from '@/lib/api'
import { cn, DAYS_OF_WEEK_FULL, formatDuration } from '@/lib/utils'

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

interface Goal {
  id: string
  title: string
  color: string
}

interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
}

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  estimatedMinutes?: number
  actualMinutes?: number
  dueDate?: string
  completedAt?: string
  goalId?: string
  goal?: Goal
  scheduleBlockId?: string
  scheduleBlock?: ScheduleBlock
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [completeMinutes, setCompleteMinutes] = useState('')
  const [completeNote, setCompleteNote] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    estimatedMinutes: '',
    goalId: '',
    scheduleBlockId: '',
    dueDate: '',
  })

   
  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [tasksRes, scheduleRes, goalsRes] = await Promise.all([
        tasksApi.list(statusFilter ? { status: statusFilter } : undefined),
        scheduleApi.getAll(),
        goalsApi.getAll('ACTIVE'),
      ])
      setTasks(tasksRes.data)
      setScheduleBlocks(scheduleRes.data)
      setGoals(goalsRes.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      const key = task.scheduleBlock ? task.scheduleBlock.dayOfWeek.toString() : 'unscheduled'
      groups[key] = groups[key] || []
      groups[key].push(task)
    })
    return groups
  }, [tasks])

  const resetCreateForm = () => {
    setForm({
      title: '',
      description: '',
      estimatedMinutes: '',
      goalId: '',
      scheduleBlockId: '',
      dueDate: '',
    })
  }

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setCreating(true)
    try {
      await tasksApi.create({
        title: form.title,
        description: form.description || undefined,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        goalId: form.goalId || undefined,
        scheduleBlockId: form.scheduleBlockId || undefined,
        dueDate: form.dueDate || undefined,
      })
      toast.success('Task created')
      resetCreateForm()
      setShowCreate(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleComplete = async () => {
    if (!completingTask) return
    const minutes = Number(completeMinutes)
    if (!minutes || minutes < 1) {
      toast.error('Enter minutes spent')
      return
    }
    try {
      await tasksApi.complete(completingTask.id, {
        actualMinutes: minutes,
        notes: completeNote || undefined,
      })
      toast.success('Task completed and logged')
      setCompletingTask(null)
      setCompleteMinutes('')
      setCompleteNote('')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete task')
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            className="border-2 border-secondary px-3 py-2 font-mono text-sm uppercase"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
        <div className="space-y-6">
          {[0, 1, 2, 3, 4, 5, 6, 'unscheduled'].map((key) => {
            const list = groupedTasks[key as string] || []
            if (!list.length) return null

            const heading = key === 'unscheduled' ? 'Unscheduled' : DAYS_OF_WEEK_FULL[Number(key)]

            return (
              <div key={key} className="card-brutal p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="font-display font-bold uppercase">{heading}</h3>
                  </div>
                  <span className="badge-brutal text-xs">
                    {list.length} task{list.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {list.map((task) => (
                    <div key={task.id} className="border-3 border-secondary bg-white p-4 shadow-brutal-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-display font-bold uppercase">{task.title}</div>
                          {task.description && <p className="mt-1 text-sm text-gray-600">{task.description}</p>}
                        </div>
                        <span
                          className={cn(
                            'badge-brutal text-xs',
                            task.status === 'COMPLETED'
                              ? 'bg-accent-green text-white'
                              : task.status === 'IN_PROGRESS'
                                ? 'bg-primary text-secondary'
                                : 'bg-gray-100',
                          )}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {task.scheduleBlock ? (
                            <span>
                              {DAYS_OF_WEEK_FULL[task.scheduleBlock.dayOfWeek]} • {task.scheduleBlock.startTime} -{' '}
                              {task.scheduleBlock.endTime}
                            </span>
                          ) : (
                            <span>No schedule linked</span>
                          )}
                        </div>
                        {task.goal && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span className="border border-secondary px-2 py-1 text-xs uppercase">
                              {task.goal.title}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          <span className="text-xs">
                            {task.estimatedMinutes ? `Est. ${formatDuration(task.estimatedMinutes)}` : 'No estimate'}
                            {task.actualMinutes ? ` • Spent ${formatDuration(task.actualMinutes)}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setCompletingTask(task)}
                            className="btn-brutal-secondary flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Complete & Log
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {!tasks.length && (
            <div className="card-brutal p-6 text-center font-mono text-gray-600">
              No tasks yet. Create one to link it to your schedule and goals.
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-xl border-3 border-secondary bg-white p-6 shadow-brutal">
            <button className="absolute right-3 top-3 text-sm font-bold" onClick={() => setShowCreate(false)}>
              ✕
            </button>
            <h3 className="mb-4 font-display text-2xl font-bold uppercase">New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm uppercase">Title</label>
                <input
                  className="input-brutal mt-1 w-full"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="font-mono text-sm uppercase">Description</label>
                <textarea
                  className="input-brutal mt-1 w-full"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="font-mono text-sm uppercase">Schedule Block</label>
                  <select
                    className="input-brutal mt-1 w-full"
                    value={form.scheduleBlockId}
                    onChange={(e) => setForm({ ...form, scheduleBlockId: e.target.value })}
                  >
                    <option value="">No schedule</option>
                    {scheduleBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {DAYS_OF_WEEK_FULL[block.dayOfWeek]} • {block.startTime}-{block.endTime} • {block.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-sm uppercase">Goal</label>
                  <select
                    className="input-brutal mt-1 w-full"
                    value={form.goalId}
                    onChange={(e) => setForm({ ...form, goalId: e.target.value })}
                  >
                    <option value="">No goal</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="font-mono text-sm uppercase">Est. Minutes</label>
                  <input
                    type="number"
                    min={1}
                    className="input-brutal mt-1 w-full"
                    value={form.estimatedMinutes}
                    onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-mono text-sm uppercase">Due Date</label>
                  <input
                    type="date"
                    className="input-brutal mt-1 w-full"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-brutal-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="btn-brutal" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md border-3 border-secondary bg-white p-6 shadow-brutal">
            <button className="absolute right-3 top-3 text-sm font-bold" onClick={() => setCompletingTask(null)}>
              ✕
            </button>
            <h3 className="mb-4 font-display text-2xl font-bold uppercase">Complete "{completingTask.title}"</h3>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-sm uppercase">Minutes spent</label>
                <input
                  type="number"
                  min={1}
                  className="input-brutal mt-1 w-full"
                  value={completeMinutes}
                  onChange={(e) => setCompleteMinutes(e.target.value)}
                />
              </div>
              <div>
                <label className="font-mono text-sm uppercase">Note</label>
                <textarea
                  className="input-brutal mt-1 w-full"
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-brutal-secondary" onClick={() => setCompletingTask(null)}>
                  Cancel
                </button>
                <button className="btn-brutal" onClick={handleComplete}>
                  Log & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
