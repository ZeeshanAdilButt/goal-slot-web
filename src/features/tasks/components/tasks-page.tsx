'use client'

import { useEffect, useState } from 'react'

import { CompleteTaskModal } from '@/features/tasks/components/complete-task-modal'
import { CreateTaskModal } from '@/features/tasks/components/create-task-modal'
import { GoalsSidebar } from '@/features/tasks/components/goals-sidebar'
import { TasksView } from '@/features/tasks/components/tasks-view'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'
import { useLocalStorage } from '@/hooks/use-local-storage'

export function TasksPage() {
  const { tasks, scheduleBlocks, goals, isLoading, goalStatus, setGoalStatus } = useTasks()

  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const completeTaskMutation = useCompleteTaskMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  
  const [selectedGoalId, setSelectedGoalId, isGoalIdInitialized] = useLocalStorage<string | null>('tasks-selected-goal-id', null)

  // Auto-select first goal when goals change 
  useEffect(() => {
    if (!isGoalIdInitialized || isLoading) return

    if (goals.length > 0) {
      const isValid = selectedGoalId && goals.some((g) => g.id === selectedGoalId)
      if (!isValid) {
        setSelectedGoalId(goals[0].id)
      }
    } else if (goals.length === 0) {
       if (selectedGoalId !== null) setSelectedGoalId(null)
    }
  }, [goals, selectedGoalId, isGoalIdInitialized, isLoading, setSelectedGoalId])

  // Filter tasks for selected goal
  const tasksForGoal = selectedGoalId ? tasks.filter((t) => t.goalId === selectedGoalId) : []

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
    <div className="flex h-full flex-col gap-0 md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <GoalsSidebar
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelectGoal={setSelectedGoalId}
          selectedStatus={goalStatus}
          onSelectStatus={setGoalStatus}
          isLoading={isLoading}
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
          <TasksView
            tasks={tasksForGoal}
            onComplete={setCompletingTask}
            onEdit={setEditingTask}
            onCreate={() => setShowCreate(true)}
            hasSelectedGoal={!!selectedGoalId}
            isLoading={isLoading}
            goals={goals}
            selectedGoalId={selectedGoalId}
            onSelectGoal={setSelectedGoalId}
            selectedStatus={goalStatus}
            onSelectStatus={setGoalStatus}
            goalsLoading={isLoading}
          />

          <CreateTaskModal
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            onSubmit={createTask}
            scheduleBlocks={scheduleBlocks}
            goals={goals}
            {...(selectedGoalId ? { defaultGoalId: selectedGoalId } : {})}
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
      </main>
    </div>
  )
}
