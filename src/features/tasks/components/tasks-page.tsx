'use client'

import { useEffect, useState } from 'react'

import { CompleteTaskModal } from '@/features/tasks/components/complete-task-modal'
import { CreateTaskModal } from '@/features/tasks/components/create-task-modal'
import { GoalsSidebar } from '@/features/tasks/components/goals-sidebar'
import { WITHOUT_GOALS_ID } from '@/features/tasks/components/goals-sidebar/types'
import { TasksView } from '@/features/tasks/components/tasks-view'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'

export function TasksPage() {
  const { tasks, scheduleBlocks, goals, isLoading, goalStatus, setGoalStatus } = useTasks()

  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const completeTaskMutation = useCompleteTaskMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  // Auto-select first goal when goals change, or "Without Goals" if no goals exist
  useEffect(() => {
    if (goals.length > 0) {
      // If a valid goal is selected, keep it. Otherwise, select the first goal.
      if (!selectedGoalId || (!goals.some((g) => g.id === selectedGoalId) && selectedGoalId !== WITHOUT_GOALS_ID)) {
        setSelectedGoalId(goals[0].id)
      }
    } else if (goals.length === 0) {
      // If no goals exist, default to "Without Goals" if there are tasks without goals
      if (selectedGoalId !== WITHOUT_GOALS_ID) {
        const hasTasksWithoutGoals = tasks.some((t) => !t.goalId)
        if (hasTasksWithoutGoals) {
          setSelectedGoalId(WITHOUT_GOALS_ID)
        } else {
          setSelectedGoalId(null)
        }
      }
    }
  }, [goals, selectedGoalId, tasks])

  // Filter tasks for selected goal
  const tasksForGoal =
    selectedGoalId === WITHOUT_GOALS_ID
      ? tasks.filter((t) => !t.goalId)
      : selectedGoalId
        ? tasks.filter((t) => t.goalId === selectedGoalId)
        : []

  const createTask = async (form: CreateTaskForm) => {
    createTaskMutation.mutate(form)
    return true
  }

  const updateTask = async (taskId: string, form: CreateTaskForm & { status?: TaskStatus }) => {
    updateTaskMutation.mutate({ taskId, data: form })
    return true
  }

  const completeTask = async (taskId: string, minutes: number, notes?: string) => {
    completeTaskMutation.mutate({ taskId, minutes, notes })
    return true
  }

  return (
    <div className="flex h-full flex-col gap-0 md:flex-row">
      <GoalsSidebar
        goals={goals}
        selectedGoalId={selectedGoalId}
        onSelectGoal={setSelectedGoalId}
        selectedStatus={goalStatus}
        onSelectStatus={setGoalStatus}
        isLoading={isLoading}
      />

      <main className="flex-1 overflow-y-auto border-l-0 border-t-3 border-secondary md:border-l-3 md:border-t-0">
        <div className="h-full">
          <TasksView
            tasks={tasksForGoal}
            onComplete={setCompletingTask}
            onEdit={setEditingTask}
            onCreate={() => setShowCreate(true)}
            hasSelectedGoal={!!selectedGoalId}
            isLoading={isLoading}
          />

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
      </main>
    </div>
  )
}
