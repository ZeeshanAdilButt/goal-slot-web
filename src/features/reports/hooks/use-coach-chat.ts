'use client'

import { useCallback, useEffect, useState } from 'react'

export type ChatRole = 'user' | 'coach'

export interface CoachChatMessage {
  id: string
  role: ChatRole
  content: string
  ts: string
}

const STORAGE_PREFIX = 'goalslot:coach:chat:'

function storageKey(periodKey: string) {
  return `${STORAGE_PREFIX}${periodKey}`
}

function makeId() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function readMessages(periodKey: string): CoachChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(periodKey))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CoachChatMessage[]) : []
  } catch {
    return []
  }
}

function writeMessages(periodKey: string, messages: CoachChatMessage[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(periodKey), JSON.stringify(messages))
}

function fakeCoachReply(userContent: string): string {
  const lower = userContent.toLowerCase()
  let body = ''
  if (lower.includes('wednesday')) {
    body =
      'Wednesday looks rough in the data — energy dipped after a packed Tuesday and the morning had three short context switches. Your sleep notes also flag a late night before. Recovery and front-loading meetings to Tuesday tend to fix this.'
  } else if (lower.includes('next week') || lower.includes('schedule')) {
    body =
      'Looking at your trends: a 90-minute block on Monday and Thursday morning would cover your top goal’s deficit. Tuesday afternoon is your strongest shallow-work window, so cluster meetings there.'
  } else if (lower.includes('leak')) {
    body =
      'The two biggest leaks: 1) sessions under 45 minutes that produced no logged output, and 2) post-lunch slots that started with no clear task. Both are spend-but-no-deposit hours.'
  } else {
    body =
      'Looking at the period, your highest-leverage move is the one you keep postponing — the one you mentioned twice in your journal but never scheduled.'
  }
  const questions = [
    'What would you change first?',
    'Which of those costs you the least to try this week?',
    'If you could only fix one of those, which?',
    'What is making the obvious move feel hard right now?',
  ]
  const q = questions[Math.floor(Math.random() * questions.length)]
  return `${body}\n\n${q}`
}

export function useCoachChat(periodKey: string) {
  const [messages, setMessages] = useState<CoachChatMessage[]>([])
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    if (!periodKey) return
    setMessages(readMessages(periodKey))
  }, [periodKey])

  const send = useCallback(
    (content: string) => {
      if (!periodKey) return
      const trimmed = content.trim()
      if (!trimmed) return

      const userMsg: CoachChatMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
        ts: new Date().toISOString(),
      }
      setMessages((prev) => {
        const next = [...prev, userMsg]
        writeMessages(periodKey, next)
        return next
      })
      setIsReplying(true)

      setTimeout(() => {
        const coachMsg: CoachChatMessage = {
          id: makeId(),
          role: 'coach',
          content: fakeCoachReply(trimmed),
          ts: new Date().toISOString(),
        }
        setMessages((prev) => {
          const next = [...prev, coachMsg]
          writeMessages(periodKey, next)
          return next
        })
        setIsReplying(false)
      }, 1000)
    },
    [periodKey],
  )

  return {
    messages,
    isReplying,
    send,
  }
}
