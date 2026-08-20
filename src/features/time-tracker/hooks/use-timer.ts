import { useCallback, useEffect, useRef, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { activeTimerApi, type ActiveTimerSessionDto } from '@/lib/api'
import { useTimerStore } from '@/lib/use-timer-store'

const ACTIVE_SESSION_QUERY_KEY = ['timer', 'session', 'active'] as const
// Short enough that a stop/pause performed in another browser shows up here
// without the user having to reload; long enough not to hammer the API while
// a tab just sits open on this page.
const POLL_MS = 20_000
/**
 * Idle cadence, used while the server reports no session at all.
 *
 * `<TimeEntryBanner/>` mounts this hook in the dashboard layout, so the poll
 * below is not a Time Tracker page cost — it runs for the entire time any
 * dashboard tab is open, which for most users is entirely time with no timer
 * running. Polling those users every 20s buys nothing: the only event the
 * poll can discover in that state is "a session appeared on another device",
 * and both `refetchOnWindowFocus` and the `visibilitychange` invalidate below
 * already catch that the moment the user comes back to this tab. So the fast
 * cadence is reserved for the state where it actually earns its keep — a live
 * session, whose stop/pause really can land from elsewhere while the user
 * watches this tab.
 *
 * The one behaviour this gives up: two browsers visible side by side, a timer
 * started in one now takes up to a minute rather than 20s to appear in the
 * other. Interacting with either window closes that gap immediately.
 */
const IDLE_POLL_MS = 60_000

/**
 * See the long comment at `serverSession` below for why this validates the
 * shape rather than testing for null. Hoisted to module scope because the
 * poll cadence has to make the same judgement before the component body runs.
 */
const asServerSession = (raw: unknown): ActiveTimerSessionDto | null =>
  raw && typeof raw === 'object' && typeof (raw as ActiveTimerSessionDto).status === 'string'
    ? (raw as ActiveTimerSessionDto)
    : null

/**
 * The local Zustand store only ever knows about a timer started in *this*
 * browser — it's plain localStorage, nothing crosses origins/browsers. The
 * backend's `/timer/session` is the actual cross-device source of truth
 * (dw-time-api's ActiveTimerController; the mobile app already treats it
 * this way). This hook layers that in: whenever the server reports a
 * session, its state wins over whatever the local store happens to say, so
 * a second browser reflects a timer started in the first one instead of
 * offering "Start tracking" over a session that's already running.
 */
export function useTimer() {
  const queryClient = useQueryClient()
  const {
    timerState: localTimerState,
    startTimestamp: localStartTimestamp,
    pausedElapsedTime: localPausedElapsedTime,
    currentTask: localCurrentTask,
    currentTaskId: localCurrentTaskId,
    currentCategory,
    currentGoalId: localCurrentGoalId,
    currentScheduleBlockId: localCurrentScheduleBlockId,
    setTask,
    setTaskId,
    setCategory,
    setGoalId,
    setScheduleBlockId,
    start: localStart,
    pause: localPause,
    resume: localResume,
    reset: localReset,
  } = useTimerStore()

  const activeSessionQuery = useQuery({
    queryKey: ACTIVE_SESSION_QUERY_KEY,
    queryFn: async () => (await activeTimerApi.getActive()).data,
    staleTime: 10_000,
    refetchInterval: (query) => (asServerSession(query.state.data) ? POLL_MS : IDLE_POLL_MS),
    refetchOnWindowFocus: true,
  })

  // Belt-and-braces for `refetchOnWindowFocus`: a background tab coming back
  // via `visibilitychange` doesn't always fire a `focus` event first.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void queryClient.invalidateQueries({ queryKey: ACTIVE_SESSION_QUERY_KEY })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [queryClient])

  // `/timer/session` answers "nothing is running" by returning null, which
  // NestJS sends as a 200 with an EMPTY body — and axios surfaces an empty
  // body as the string '' , not null. `?? null` only catches null/undefined,
  // so '' sailed through as a truthy "session" whose every field was
  // undefined. That produced the phantom the user kept seeing: status
  // undefined !== 'RUNNING' so the UI said PAUSED, taskName ?? '' rendered
  // as "Untitled session", and accumulatedMs ?? 0 showed 00:00:00 — a paused
  // timer that could never be stopped, because there was no session to stop.
  //
  // So validate the shape instead of testing for null: it is only a session
  // if it is an object carrying a status.
  const serverSession = asServerSession(activeSessionQuery.data)
  const hasServerSession = serverSession !== null

  const invalidateSession = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ACTIVE_SESSION_QUERY_KEY }),
    [queryClient],
  )

  // The local store is plain localStorage: once a browser sets it to
  // RUNNING/PAUSED it stays that way indefinitely, even long after the
  // session it referred to was stopped or discarded from a different
  // device (or from this same browser, days ago). Every write path that
  // ends a session already calls localReset() as part of it - start,
  // pause, resume, discard - so this only ever needs to catch the case
  // those paths can't: state left behind before this browser ever loads
  // the app on this visit. Reconciling once, the moment the first real
  // server answer comes back, clears that without fighting an optimistic
  // start a user just made in *this* tab - by the time that happens,
  // hasReconciledOnceRef is already true and this effect is inert.
  const hasReconciledOnceRef = useRef(false)
  useEffect(() => {
    if (hasReconciledOnceRef.current) return
    if (!activeSessionQuery.isSuccess) return
    hasReconciledOnceRef.current = true
    if (serverSession === null && localTimerState !== 'STOPPED') {
      localReset()
    }
  }, [activeSessionQuery.isSuccess, serverSession, localTimerState, localReset])

  // A session ending on another device (stop or discard) writes a TimeEntry
  // server-side that this browser has no way to hear about directly - there
  // is no push channel for it, only this 20s poll of the session endpoint.
  // Reported: a timer started and stopped from the phone correctly stopped
  // on web too (the poll picked that transition up), but the newly-created
  // entry never appeared in the Recent Entries list, because nothing ever
  // invalidated it - only this page's own local stop/create mutation does
  // that, and no local mutation ran here.
  //
  // hasServerSession flipping true -> false is exactly the signal "a session
  // that existed a moment ago is now gone", which on the server only ever
  // means it was stopped or discarded - by definition, whichever device did
  // it already knows what it did to the entries list. This device does not,
  // so on that specific transition (never on the initial mount, where it
  // would just be reacting to "there was never anything to lose") invalidate
  // the entries list so it catches up within the same poll window the header
  // already updates on.
  const hadServerSessionRef = useRef(false)
  useEffect(() => {
    if (hadServerSessionRef.current && !hasServerSession) {
      void queryClient.invalidateQueries({ queryKey: ['time-tracker'] })
    }
    hadServerSessionRef.current = hasServerSession
  }, [hasServerSession, queryClient])

  // Server, when present, is authoritative — same rule the mobile client
  // already follows. Everything below is the local Zustand shape, just
  // sourced from whichever side actually knows what's running.
  const effectiveTimerState = hasServerSession
    ? serverSession.status === 'RUNNING'
      ? 'RUNNING'
      : 'PAUSED'
    : localTimerState
  const effectiveStartTimestamp = hasServerSession
    ? serverSession.status === 'RUNNING' && serverSession.segmentStartedAt
      ? new Date(serverSession.segmentStartedAt).getTime()
      : null
    : localStartTimestamp
  // accumulatedMs is milliseconds; the local store's pausedElapsedTime is
  // seconds — this is the one place that unit boundary gets crossed.
  const effectivePausedElapsedTime = hasServerSession
    ? Math.floor((serverSession.accumulatedMs ?? 0) / 1000)
    : localPausedElapsedTime
  const effectiveCurrentTask = hasServerSession ? (serverSession.taskName ?? '') : localCurrentTask
  const effectiveCurrentTaskId = hasServerSession ? (serverSession.taskId ?? '') : localCurrentTaskId
  const effectiveCurrentGoalId = hasServerSession ? (serverSession.goalId ?? '') : localCurrentGoalId
  const effectiveCurrentScheduleBlockId = hasServerSession
    ? (serverSession.scheduleBlockId ?? '')
    : localCurrentScheduleBlockId

  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (effectiveTimerState === 'RUNNING' && effectiveStartTimestamp) {
      const updateElapsed = () =>
        setElapsedTime(Math.floor((Date.now() - effectiveStartTimestamp) / 1000) + effectivePausedElapsedTime)

      updateElapsed()
      timerRef.current = setInterval(updateElapsed, 1000)
    } else {
      setElapsedTime(effectivePausedElapsedTime)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [effectiveTimerState, effectiveStartTimestamp, effectivePausedElapsedTime])

  // Guards the rollback below against overlapping start() calls - e.g. the
  // confirmation dialog's handleDiscardAndContinue fires reset() then start()
  // for a new task without awaiting the first, or a user double-clicks Start
  // before the first request resolves. Each call claims the next number
  // before it fires its request; a failure only rolls back local state if it
  // is still the most recent call by the time its response comes back. Without
  // this, a slow, older request failing after a newer one already succeeded
  // would wipe the newer (legitimate) running session - the same class of bug
  // this fix exists to close, just via a different path.
  const startRequestSeqRef = useRef(0)

  const start = useCallback(
    (
      task: string,
      taskId: string,
      category: string,
      goalId: string,
      scheduleBlockId?: string,
      // Set by useStartTimerWithConfirmation once the user has explicitly
      // chosen to save-and-switch or discard-and-continue over an already
      // running session — the server would otherwise 409 on exactly the
      // session that confirmation dialog just resolved.
      takeOver?: boolean,
    ) => {
      const requestSeq = ++startRequestSeqRef.current

      // Optimistic: the button should feel instant in the browser that
      // pressed it, same as before this hook talked to the server at all.
      localStart(task, taskId, category, goalId, scheduleBlockId)
      activeTimerApi
        .start({
          taskName: task || undefined,
          taskId: taskId || undefined,
          goalId: goalId || undefined,
          scheduleBlockId: scheduleBlockId || undefined,
          client: 'web',
          takeOver,
        })
        .catch((err) => {
          // A newer start() has since claimed the store - this failure is
          // stale and must not touch state a later call already owns.
          if (requestSeq !== startRequestSeqRef.current) return

          // Any failure here means the server never created a session row —
          // the optimistic localStart() above is the only place this timer
          // exists. Previously only 409 rolled that back; every other status
          // (403 daily-entry plan limit, 400 bad goal/task/scheduleBlock
          // attribution, a dropped request, ...) fell through silently, so
          // the UI kept showing "running" - accurately, from this browser's
          // point of view - for as long as the user stayed on the page. The
          // reconciliation effect above then wipes that same local state the
          // moment it gets a real answer from the server (on the next
          // refresh, most commonly), because by then it genuinely is stale:
          // nothing was ever running. That silent round trip is what reads
          // to the user as "I started a timer, walked away, and it was gone
          // when I came back" with no error ever shown. Roll back immediately
          // and say why, so the failure is visible at the moment it happens
          // instead of a mysteriously vanished session later.
          localReset()
          if (err?.response?.status === 409) {
            toast.error('A session was already running — showing that one instead.')
            return
          }
          const message = err?.response?.data?.message
          toast.error(typeof message === 'string' ? message : 'Could not start the timer — please try again.')
        })
        .finally(() => void invalidateSession())
    },
    [localStart, localReset, invalidateSession],
  )

  const pause = useCallback(
    (elapsedSeconds: number) => {
      localPause(elapsedSeconds)
      activeTimerApi
        .pause()
        .catch(() => {
          // Best-effort: local state already reflects "paused" for this
          // browser regardless, and the next poll reconciles either way.
        })
        .finally(() => void invalidateSession())
    },
    [localPause, invalidateSession],
  )

  const resume = useCallback(() => {
    localResume()
    activeTimerApi
      .resume()
      .catch(() => {})
      .finally(() => void invalidateSession())
  }, [localResume, invalidateSession])

  const reset = useCallback(() => {
    localReset()
    // Fires on both an actual Stop (after the time entry is already saved)
    // and a plain Reset/discard — either way the local session is done with,
    // so clear the server-side marker too. Best-effort: a failure here just
    // leaves a stale row for the next stale-session check to surface, not a
    // lost time entry (that was already written before this runs).
    activeTimerApi
      .discard()
      .catch(() => {})
      .finally(() => void invalidateSession())
  }, [localReset, invalidateSession])

  return {
    timerState: effectiveTimerState,
    elapsedTime,
    currentTask: effectiveCurrentTask,
    currentTaskId: effectiveCurrentTaskId,
    currentCategory,
    currentGoalId: effectiveCurrentGoalId,
    currentScheduleBlockId: effectiveCurrentScheduleBlockId,
    setTask,
    setTaskId,
    setCategory,
    setGoalId,
    setScheduleBlockId,
    start,
    pause,
    resume,
    reset,
    setElapsedTime, // Exposed for reset logic if needed, though reset() handles store
    startTimestamp: effectiveStartTimestamp,
  }
}
