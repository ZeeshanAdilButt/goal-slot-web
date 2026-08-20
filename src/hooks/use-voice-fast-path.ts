'use client'

import { useCallback } from 'react'

import { type QueryClient, useQueryClient } from '@tanstack/react-query'

import { goalQueries } from '@/features/goals/utils/queries'
import { useUpdateGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { taskQueries } from '@/features/tasks/utils/queries'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { useTimer } from '@/features/time-tracker/hooks/use-timer'

import { coachApi, goalsApi, tasksApi, type CoachVoiceIntentContext } from '@/lib/api'
import { escapeHtml } from '@/lib/escape-html'
import { appendToTodayJournal } from '@/lib/journal-quick-append'
import { formatDuration, getLocalDateString } from '@/lib/utils'
import {
  planVoiceAction,
  type VoiceCandidateGoal,
  type VoiceCandidateTask,
} from '@/lib/voice-intent-plan'

export type VoiceFastPathResult = { handled: true; summary: string } | { handled: false }

interface CachedGoal extends VoiceCandidateGoal {
  description?: string
}

interface CachedTask extends VoiceCandidateTask {
  notes?: string
}

/** Every cached goal list, deduped by id — mirrors the scan CoachProposalCard
 *  already does to resolve ids to human-readable rows (findGoal in
 *  coach-proposal-card.tsx), reused here to build the classifier's context
 *  without forcing a fresh network fetch just for the mic button. */
function collectCachedGoals(queryClient: QueryClient): CachedGoal[] {
  const lists = queryClient.getQueriesData<CachedGoal[]>({ queryKey: goalQueries.all })
  const map = new Map<string, CachedGoal>()
  for (const [key, data] of lists) {
    if (key[1] !== 'list' || !Array.isArray(data)) continue
    for (const g of data) {
      if (g?.id && g?.title && !map.has(g.id)) {
        map.set(g.id, { id: g.id, title: g.title, description: (g as { description?: string }).description })
      }
    }
  }
  return Array.from(map.values())
}

function collectCachedTasks(queryClient: QueryClient): CachedTask[] {
  const lists = queryClient.getQueriesData<CachedTask[]>({ queryKey: taskQueries.all })
  const map = new Map<string, CachedTask>()
  for (const [key, data] of lists) {
    if (key[1] !== 'list' || !Array.isArray(data)) continue
    for (const t of data) {
      if (t?.id && t?.title && !map.has(t.id)) {
        map.set(t.id, {
          id: t.id,
          title: t.title,
          goalId: (t as { goalId?: string }).goalId,
          notes: (t as { notes?: string }).notes,
        })
      }
    }
  }
  return Array.from(map.values())
}

function findCachedGoal(queryClient: QueryClient, id: string): CachedGoal | undefined {
  return collectCachedGoals(queryClient).find((g) => g.id === id)
}

function findCachedTask(queryClient: QueryClient, id: string): CachedTask | undefined {
  return collectCachedTasks(queryClient).find((t) => t.id === id)
}

/**
 * The voice fast path: classify a transcript against `/coach/voice-intent`
 * (a plain REST call, not an LLM conversation) and, when the result is
 * confidently actionable, run the matching direct mutation instead of
 * handing the transcript to the full Coach chat.
 *
 * `attempt` never throws for "this isn't a fast-path command" — that's
 * `{ handled: false }`, and the caller (FloatingVoiceButton) falls through
 * to `requestCoachSend` exactly as it did before this existed. It *can*
 * throw once a plan has been chosen and its mutation actually fails (a
 * timer stop that couldn't save, a note that couldn't write) — that's a
 * real error, not a "try the Coach instead" situation, since silently
 * re-sending the transcript to Coach at that point would risk a confusing
 * double action.
 */
export function useVoiceFastPath() {
  const queryClient = useQueryClient()
  // useTimer, not the raw Zustand store: the store's start/pause/resume/reset
  // only touch this browser's local state, so a timer started or stopped by
  // voice never reached the server - it vanished on the next refresh and never
  // appeared on other devices. useTimer wraps those same actions with the
  // /timer/session calls that make a session real.
  const timer = useTimer()
  const createEntry = useCreateTimeEntry()
  const createTask = useCreateTaskMutation()
  const updateTask = useUpdateTaskMutation()
  const updateGoal = useUpdateGoalMutation()

  const attempt = useCallback(
    async (transcript: string): Promise<VoiceFastPathResult> => {
      const goals = collectCachedGoals(queryClient)
      const tasks = collectCachedTasks(queryClient)
      const timerStatus: CoachVoiceIntentContext['timerStatus'] =
        timer.timerState === 'RUNNING' ? 'running' : timer.timerState === 'PAUSED' ? 'paused' : 'idle'

      let intent
      try {
        const res = await coachApi.classifyVoiceIntent(transcript, {
          candidateGoals: goals.map((g) => ({ id: g.id, title: g.title })),
          candidateTasks: tasks.map((t) => ({ id: t.id, title: t.title, goalId: t.goalId })),
          timerStatus,
        })
        intent = res.data
      } catch {
        // Classify failed or timed out — never block the user on it.
        return { handled: false }
      }

      const plan = planVoiceAction({ response: intent, timerState: timer.timerState, goals, tasks })

      switch (plan.kind) {
        case 'fallback-to-coach':
          return { handled: false }

        case 'start-timer': {
          timer.start(plan.task, plan.taskId, timer.currentCategory, plan.goalId)
          return { handled: true, summary: plan.task ? `Started tracking "${plan.task}".` : 'Timer started.' }
        }

        case 'pause-timer': {
          const elapsed = timer.elapsedTime
          timer.pause(elapsed)
          return { handled: true, summary: 'Timer paused.' }
        }

        case 'resume-timer': {
          timer.resume()
          return { handled: true, summary: 'Timer resumed.' }
        }

        case 'stop-timer': {
          const elapsed = timer.elapsedTime
          const duration = Math.max(1, Math.floor(elapsed / 60))
          const startedAt = timer.startTimestamp ? new Date(timer.startTimestamp).toISOString() : undefined
          await createEntry.mutateAsync({
            taskName: timer.currentTask || 'Voice session',
            taskId: timer.currentTaskId || undefined,
            taskTitle: timer.currentTask || undefined,
            duration,
            date: getLocalDateString(),
            goalId: timer.currentGoalId || undefined,
            startedAt,
            scheduleBlockId: timer.currentScheduleBlockId || undefined,
          })
          timer.reset()
          return { handled: true, summary: `Logged ${formatDuration(duration)}.` }
        }

        case 'append-journal': {
          await appendToTodayJournal(queryClient, plan.text)
          return { handled: true, summary: 'Added to today’s journal.' }
        }

        case 'append-note': {
          if (plan.targetKind === 'task') {
            const cached = findCachedTask(queryClient, plan.targetId)
            const existingNotes = cached?.notes ?? (await tasksApi.getOne(plan.targetId)).data?.notes ?? ''
            const nextNotes = existingNotes ? `${existingNotes}\n${plan.text}` : plan.text
            await updateTask.mutateAsync({ taskId: plan.targetId, data: { notes: nextNotes } })
            return { handled: true, summary: 'Added to the task’s notes.' }
          }
          const cached = findCachedGoal(queryClient, plan.targetId)
          const existingDescription =
            cached?.description ?? (await goalsApi.getOne(plan.targetId)).data?.description ?? ''
          const nextDescription = `${existingDescription}<p>${escapeHtml(plan.text)}</p>`
          await updateGoal.mutateAsync({ id: plan.targetId, data: { description: nextDescription } })
          return { handled: true, summary: 'Added to the goal’s notes.' }
        }

        case 'create-task': {
          await createTask.mutateAsync({
            title: plan.title,
            description: '',
            category: '',
            estimatedMinutes: '',
            goalId: plan.goalId ?? '',
            scheduleBlockId: '',
            dueDate: '',
          })
          return { handled: true, summary: `Created task "${plan.title}".` }
        }

        default:
          return { handled: false }
      }
    },
    [queryClient, timer, createEntry, createTask, updateTask, updateGoal],
  )

  return { attempt }
}
