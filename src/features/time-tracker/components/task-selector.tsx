import { useEffect, useRef, useState } from 'react'

import { Task } from '@/features/time-tracker/utils/types'
import { Plus, Search } from 'lucide-react'

import AnimateChangeInHeight from '@/components/animate-change-in-height'

interface TaskSelectorProps {
  tasks: Task[]
  currentTaskId: string
  currentTask: string
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  onTaskIdChange: (id: string) => void
  onTaskTitleChange: (title: string) => void
  onCreateTask?: (title: string) => Promise<Task | null>
  variant?: 'dark' | 'light'
}

export function TaskSelector({
  tasks,
  currentTaskId,
  currentTask,
  timerState,
  onTaskIdChange,
  onTaskTitleChange,
  onCreateTask,
  variant = 'dark',
}: TaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter tasks based on search
  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(searchValue.toLowerCase()))

  const groupedTasks = filteredTasks.reduce((groups: { label: string; tasks: Task[] }[], task) => {
    const label = task.goal?.title || 'No Goal'
    const existing = groups.find((group) => group.label === label)
    if (existing) {
      existing.tasks.push(task)
    } else {
      groups.push({ label, tasks: [task] })
    }
    return groups
  }, [])

  // Check if we should show "create new" option
  const showCreateOption =
    searchValue.trim() && !filteredTasks.some((t) => t.title.toLowerCase() === searchValue.toLowerCase())

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only sync searchValue when a task is explicitly selected (currentTaskId changes)
  useEffect(() => {
    // Don't sync if input is currently focused (user is typing)
    if (inputRef.current === document.activeElement) {
      return
    }

    if (currentTaskId) {
      // Sync when task is explicitly selected
      const task = tasks.find((t) => t.id === currentTaskId)
      if (task && task.title !== searchValue) {
        setSearchValue(task.title)
      }
    } else if (!currentTaskId && !currentTask && searchValue) {
      // Only clear if both are empty and input is not focused
      if (inputRef.current !== document.activeElement) {
        setSearchValue('')
      }
    }
  }, [currentTaskId, tasks]) // Only depend on currentTaskId, not currentTask

  const handleSelectTask = (task: Task) => {
    onTaskIdChange(task.id)
    onTaskTitleChange(task.title)
    setSearchValue(task.title)
    setIsOpen(false)
  }

  const handleCreateNew = async () => {
    if (!searchValue.trim() || !onCreateTask) return

    setIsCreating(true)
    try {
      const newTask = await onCreateTask(searchValue.trim())
      if (newTask) {
        onTaskIdChange(newTask.id)
        onTaskTitleChange(newTask.title)
        setSearchValue(newTask.title)
      }
    } finally {
      setIsCreating(false)
      setIsOpen(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSearchValue(value)
    onTaskTitleChange(value)
    // Clear task ID when typing a new value that doesn't match
    if (currentTaskId) {
      const selectedTask = tasks.find((t) => t.id === currentTaskId)
      if (selectedTask && selectedTask.title !== value) {
        onTaskIdChange('')
      }
    }
    if (!isOpen) setIsOpen(true)
  }

  const isDisabled = timerState !== 'STOPPED'

  return (
    <div className="relative mb-6 text-left" ref={dropdownRef}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        What are you working on?
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!isDisabled) {
              setIsOpen(true)
            }
          }}
          placeholder="Type a task name, or pick one below..."
          disabled={isDisabled}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !isDisabled && (
        <AnimateChangeInHeight className="absolute z-50 mt-1 w-full">
          <div className="rounded-lg border border-zinc-200 bg-white shadow-lg">
            <div className="max-h-80 overflow-auto">
              {groupedTasks.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 z-10 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {group.label}
                  </div>
                  {group.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleSelectTask(task)}
                      className={`flex w-full flex-col gap-0.5 border-b border-zinc-50 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-zinc-50 ${
                        currentTaskId === task.id ? 'bg-[#f2cc0d]/10' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-900">{task.title}</span>
                      {task.goal?.title && (
                        <span className="text-[11px] text-zinc-500">{task.goal.title}</span>
                      )}
                      {task.category && !task.goal?.title && (
                        <span className="text-[11px] text-zinc-500">{task.category}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}

              {filteredTasks.length === 0 && !showCreateOption && (
                <div className="px-3 py-3 text-center text-sm text-zinc-500">
                  {tasks.length === 0 ? 'No tasks yet, type to create one.' : 'No tasks found.'}
                </div>
              )}
            </div>

            {/* Create new option */}
            {showCreateOption && onCreateTask && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">
                  {isCreating ? 'Creating...' : (
                    <>
                      Create <span className="font-semibold text-zinc-900">"{searchValue.trim()}"</span>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </AnimateChangeInHeight>
      )}
    </div>
  )
}
