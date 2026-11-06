import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { useProjectMembersQuery } from '@/features/projects/hooks/use-projects'
import {
  assignableMembers,
  assigneeAfterProjectChange,
  assigneeIdOf,
  projectIdOf,
  canChangeTaskProject,
  canSetTaskGoal,
  projectFieldsPayload,
  sanitizeAssignee,
  writableProjects,
} from '@/features/projects/utils/task-fields'
import type { ProjectSummary } from '@/features/projects/utils/types'
import { CreateTaskForm, Goal, ScheduleBlock, Task } from '@/features/tasks/utils/types'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// TiptapEditor pulls in the full StarterKit + a dozen extension packages.
// This modal renders unconditionally inside TasksPage (just hidden while
// closed), so a static import shipped that whole editor bundle on first
// paint of the Tasks route even when the user never opens "New Task".
// Loading it on demand keeps it out of the initial route bundle.
const TiptapEditor = dynamic(
  () => import('@/components/tiptap-editor/tiptap-editor').then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-[250px] animate-pulse rounded-lg bg-zinc-50" />,
  },
)

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: CreateTaskForm) => Promise<boolean>
  scheduleBlocks: ScheduleBlock[]
  goals: Goal[]
  task?: Task | null
  defaultGoalId?: string
  /** Projects I belong to. Only Admin/Member ones are offered as a destination. */
  projects?: ProjectSummary[]
  /** Pre-selects a project for a new task (project mode). */
  defaultProjectId?: string
  meId?: string | null
  /** View-only (Guests): every field disabled, no save. */
  readOnly?: boolean
}

const MY_TASKS_VALUE = '__my_tasks__'
const UNASSIGNED_VALUE = '__unassigned__'

const STATUS_OPTIONS = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'DOING', label: 'Doing' },
  { value: 'DONE', label: 'Done' },
]
const NO_GOAL_VALUE = 'no_goal'

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  scheduleBlocks,
  goals,
  task,
  defaultGoalId,
  projects = [],
  defaultProjectId,
  meId,
  readOnly = false,
}: CreateTaskModalProps) {
  const [creating, setCreating] = useState(false)
  const [estimatedHours, setEstimatedHours] = useState('')
  const [status, setStatus] = useState('BACKLOG')
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const membersQuery = useProjectMembersQuery(isOpen && projectId ? projectId : null)
  const members = membersQuery.data
  const projectChoices = useMemo(() => {
    const writable = writableProjects(projects)
    // Keep the task's current project visible even when it is not writable
    // (a Guest viewing it), so the field still says where the task lives.
    const current = projects.find((p) => p.id === projectId)
    return current && !writable.includes(current) ? [...writable, current] : writable
  }, [projects, projectId])
  const showProjectField = projectChoices.length > 0 || !!projectId
  const projectLocked = readOnly || !canChangeTaskProject(task, meId)
  const goalLocked = readOnly || !canSetTaskGoal(task, meId)
  const assigneeChoices = useMemo(() => assignableMembers(members ?? []), [members])

  const goalOptions = useMemo(() => [
    { value: NO_GOAL_VALUE, label: 'No Goal' },
    ...goals.map((g) => ({
      value: g.id,
      label: g.title,
      color: g.color,
    }))
  ], [goals])

  const [form, setForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    category: '',
    estimatedMinutes: '',
    goalId: '',
    scheduleBlockId: '',
    dueDate: '',
    notes: '',
  })

  // Fill the form once per opening (per task). Re-running on every prop
  // change wiped an unsaved draft, e.g. when Back/Forward switched the board
  // (new defaultProjectId) or goals refetched while the modal was open.
  const initializedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!isOpen) {
      initializedFor.current = null
      return
    }
    const key = task ? `task:${task.id}` : 'new'
    if (initializedFor.current === key) return
    initializedFor.current = key
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || '',
        estimatedMinutes: task.estimatedMinutes?.toString() || '',
        goalId: task.goalId || '',
        scheduleBlockId: task.scheduleBlockId || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        notes: task.notes || '',
      })
      setStatus(task.status || 'BACKLOG')
      setProjectId(projectIdOf(task) || '')
      setAssigneeId(assigneeIdOf(task) || '')

      // Calculate hours from minutes (e.g. 90 mins -> 1.5 hours)
      if (task.estimatedMinutes) {
        setEstimatedHours((task.estimatedMinutes / 60).toString())
      } else {
        setEstimatedHours('')
      }
    } else {
      const initialForm: CreateTaskForm = {
        title: '',
        description: '',
        category: '',
        estimatedMinutes: '',
        goalId: defaultGoalId || '',
        scheduleBlockId: '',
        dueDate: '',
        notes: '',
      }

      setEstimatedHours('')
      setStatus('BACKLOG')
      setProjectId(defaultProjectId || '')
      setAssigneeId('')

      // Pre-fill from default goal
      if (defaultGoalId) {
        const selectedGoal = goals.find((g) => g.id === defaultGoalId)
        if (selectedGoal && selectedGoal.category) {
          initialForm.category = selectedGoal.category
        }
      }

      // Auto-select goal if only one exists and no default goal provided
      // (not on a project board: a shared task should not silently pick up
      // one of my personal goals).
      if (!defaultGoalId && !defaultProjectId && goals.length === 1) {
        initialForm.goalId = goals[0].id
      }

      setForm(initialForm)
    }
  }, [task, isOpen, defaultGoalId, defaultProjectId, goals, scheduleBlocks])

  const handleSubmit = async () => {
    if (readOnly || !form.title.trim()) return
    setCreating(true)

    // Convert hours back to minutes for submission if valid (e.g. 1.5 -> 90)
    let finalForm: CreateTaskForm & { status: string } = {
      ...form,
      status,
      // Goals stay personal: someone else's project task never carries a goal from us.
      goalId: goalLocked ? '' : form.goalId,
      ...projectFieldsPayload(
        task,
        projectId,
        sanitizeAssignee(assigneeId, projectId, members, task ? assigneeIdOf(task) : null),
      ),
    }
    if (estimatedHours && !isNaN(parseFloat(estimatedHours))) {
      finalForm.estimatedMinutes = Math.round(parseFloat(estimatedHours) * 60).toString()
    } else {
      finalForm.estimatedMinutes = ''
    }

    const success = await onSubmit(finalForm)
    setCreating(false)
    if (success) {
      setForm({
        title: '',
        description: '',
        category: '',
        estimatedMinutes: '',
        goalId: '',
        scheduleBlockId: '',
        dueDate: '',
        notes: '',
      })
      setEstimatedHours('')
      setStatus('BACKLOG')
      setProjectId('')
      setAssigneeId('')
      onClose()
    }
  }

  const handleProjectChange = (value: string) => {
    const next = value === MY_TASKS_VALUE ? '' : value
    setAssigneeId(assigneeAfterProjectChange(projectId, next, assigneeId))
    setProjectId(next)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-screen  h-dvh max-h-dvh overflow-y-auto p-2 sm:max-h-fit sm:w-[90vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900">
            {readOnly ? 'Task' : task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
          {readOnly ? (
            <p className="text-xs text-zinc-500">You are a guest in this project, so tasks are view only.</p>
          ) : null}
        </DialogHeader>
        <fieldset disabled={readOnly} className="m-0 min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto border-0 p-0 pr-1">
          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">
              Title <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter task title..."
            />
          </div>

          {/* First row: Status and Goal (both Selects) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Goal</Label>
              {goalLocked ? (
                <p className="flex h-9 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">
                  {task?.goal?.title ?? 'Goals are personal. Only the creator sets one.'}
                </p>
              ) : (
                <SearchableSelect
                  value={form.goalId || NO_GOAL_VALUE}
                  onChange={(value) => setForm({ ...form, goalId: value === NO_GOAL_VALUE ? '' : value })}
                  options={goalOptions}
                  placeholder="Select a goal"
                />
              )}
            </div>
          </div>

          {showProjectField ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="task-project" className="mb-1.5 block text-[10px] tracking-wider">
                  Project
                </Label>
                <Select value={projectId || MY_TASKS_VALUE} onValueChange={handleProjectChange} disabled={projectLocked}>
                  <SelectTrigger id="task-project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MY_TASKS_VALUE}>My tasks</SelectItem>
                    {projectChoices.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {projectId ? (
                <div>
                  <Label htmlFor="task-assignee" className="mb-1.5 block text-[10px] tracking-wider">
                    Assignee
                  </Label>
                  <Select
                    value={assigneeId || UNASSIGNED_VALUE}
                    onValueChange={(v) => setAssigneeId(v === UNASSIGNED_VALUE ? '' : v)}
                    disabled={readOnly || membersQuery.isLoading}
                  >
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder={membersQuery.isLoading ? 'Loading members...' : 'Unassigned'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {assigneeChoices.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.name}
                          {m.userId === meId ? ' (you)' : ''}
                        </SelectItem>
                      ))}
                      {assigneeId && !assigneeChoices.some((m) => m.userId === assigneeId) && task?.assignee ? (
                        <SelectItem value={assigneeId}>{task.assignee.name}</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Second row: Est. Hours and Due Date (both inputs) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Est. Hours</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Description with resizable textarea */}
          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">Description</Label>
            <div className="w-full rounded-lg border border-zinc-200 bg-white">
              <TiptapEditor
                content={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Details of the task..."
                className="max-h-[450px] min-h-[250px] resize-y overflow-y-auto border-none shadow-none"
                editable={!readOnly}
              />
            </div>
          </div>

          {/* Notes field */}
          <div>
            <Label className="mb-1.5 flex items-center justify-between text-[10px] tracking-wider">
              <span>Notes</span>
              <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">optional</span>
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this task..."
              rows={3}
              className="min-h-[80px]"
            />
          </div>
        </fieldset>
        <DialogFooter className="mt-4 flex-row gap-3 border-t border-zinc-200 pt-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {readOnly ? null : (
            <Button type="button" variant="brand" className="flex-1" onClick={handleSubmit} disabled={creating}>
              {creating ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
