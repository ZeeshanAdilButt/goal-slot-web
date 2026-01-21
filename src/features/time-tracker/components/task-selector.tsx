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
    <div className="relative mb-6" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-bold uppercase opacity-75">What are you working on?</label>

      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
            variant === 'dark' ? 'text-white/50' : 'text-black/40'
          }`}
        />
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
          placeholder="Type to search or create a task..."
          disabled={isDisabled}
          className={`w-full border-3 py-3 pl-10 pr-4 text-lg font-bold focus:border-primary focus:outline-none disabled:opacity-50 ${
            variant === 'dark'
              ? 'border-white/30 bg-white/10 text-white placeholder-white/50'
              : 'border-black/20 bg-white text-black placeholder-black/40'
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && !isDisabled && (filteredTasks.length > 0 || showCreateOption) && (
        <AnimateChangeInHeight className="absolute z-50 mt-1 w-full">
          <div className="border-3 border-black bg-white shadow-brutal">
            {/* Existing tasks */}
            <div className="max-h-80 overflow-auto">
              {groupedTasks.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 border-b border-gray-200 bg-gray-300 px-4 py-2 text-xs font-bold uppercase text-gray-700">
                    {group.label}
                  </div>
                  {group.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleSelectTask(task)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-100 ${
                        currentTaskId === task.id ? 'bg-primary/20 font-bold' : ''
                      }`}
                    >
                      <span className="block font-medium text-black">{task.title}</span>
                      {task.goal?.title && <span className="block text-xs text-gray-500">Goal: {task.goal.title}</span>}
                      {task.category && !task.goal?.title && (
                        <span className="block text-xs text-gray-500">{task.category}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}

              {/* No results message */}
              {filteredTasks.length === 0 && !showCreateOption && (
                <div className="px-4 py-3 text-center text-gray-500">No tasks found</div>
              )}
            </div>

            {/* Create new option */}
            {showCreateOption && onCreateTask && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="flex w-full items-center gap-2 border-t-2 border-gray-200 px-4 py-3 text-left transition-colors hover:bg-accent-green/20"
              >
                <Plus className="h-4 w-4 text-accent-green" />
                <span className="font-medium text-black">
                  {isCreating ? 'Creating...' : `Create "${searchValue.trim()}"`}
                </span>
              </button>
            )}
          </div>
        </AnimateChangeInHeight>
      )}
    </div>
  )
}
