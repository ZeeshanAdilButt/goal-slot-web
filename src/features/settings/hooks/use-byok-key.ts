'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'goalslot:coach:byok'

export type ByokStatus = 'active' | 'unset'

export interface ByokState {
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
  status: ByokStatus
}

interface PersistedState {
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
}

const DEFAULT_LIMIT = 100000

function readState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function writeState(state: PersistedState | null) {
  if (typeof window === 'undefined') return
  if (state === null) {
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

function maskKey(rawKey: string): string {
  const trimmed = rawKey.trim()
  if (trimmed.length <= 4) return `sk-...${trimmed}`
  return `sk-...${trimmed.slice(-4)}`
}

export function useByokKey() {
  const [state, setState] = useState<ByokState>({
    maskedKey: null,
    tokensUsed: 0,
    tokensLimit: DEFAULT_LIMIT,
    status: 'unset',
  })

  useEffect(() => {
    const persisted = readState()
    if (persisted && persisted.maskedKey) {
      setState({
        maskedKey: persisted.maskedKey,
        tokensUsed: persisted.tokensUsed ?? 12450,
        tokensLimit: persisted.tokensLimit ?? DEFAULT_LIMIT,
        status: 'active',
      })
    }
  }, [])

  const saveKey = useCallback((rawKey: string) => {
    const masked = maskKey(rawKey)
    const next: PersistedState = {
      maskedKey: masked,
      tokensUsed: 12450,
      tokensLimit: DEFAULT_LIMIT,
    }
    writeState(next)
    setState({
      maskedKey: masked,
      tokensUsed: next.tokensUsed,
      tokensLimit: next.tokensLimit,
      status: 'active',
    })
    return { success: true as const, maskedKey: masked }
  }, [])

  const deleteKey = useCallback(() => {
    writeState(null)
    setState({
      maskedKey: null,
      tokensUsed: 0,
      tokensLimit: DEFAULT_LIMIT,
      status: 'unset',
    })
  }, [])

  return {
    ...state,
    saveKey,
    deleteKey,
  }
}
