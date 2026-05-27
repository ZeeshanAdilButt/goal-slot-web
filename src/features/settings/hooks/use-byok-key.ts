'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'goalslot:coach:byok'

export type ByokProvider = 'openai' | 'anthropic'
export type ByokStatus = 'active' | 'unset'

export interface ByokState {
  provider: ByokProvider
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
  status: ByokStatus
}

interface PersistedState {
  provider: ByokProvider
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
}

const DEFAULT_LIMIT = 100000
const DEFAULT_PROVIDER: ByokProvider = 'openai'

export const PROVIDER_META: Record<
  ByokProvider,
  { label: string; placeholder: string; consoleUrl: string; prefix: string }
> = {
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
  },
  anthropic: {
    label: 'Anthropic',
    placeholder: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
  },
}

function readState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      provider: parsed.provider === 'anthropic' ? 'anthropic' : 'openai',
      maskedKey: parsed.maskedKey ?? null,
      tokensUsed: parsed.tokensUsed ?? 0,
      tokensLimit: parsed.tokensLimit ?? DEFAULT_LIMIT,
    }
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

function maskKey(rawKey: string, provider: ByokProvider): string {
  const trimmed = rawKey.trim()
  const tail = trimmed.length > 4 ? trimmed.slice(-4) : trimmed
  return `${PROVIDER_META[provider].prefix}...${tail}`
}

export function useByokKey() {
  const [state, setState] = useState<ByokState>({
    provider: DEFAULT_PROVIDER,
    maskedKey: null,
    tokensUsed: 0,
    tokensLimit: DEFAULT_LIMIT,
    status: 'unset',
  })

  useEffect(() => {
    const persisted = readState()
    if (persisted && persisted.maskedKey) {
      setState({
        provider: persisted.provider,
        maskedKey: persisted.maskedKey,
        tokensUsed: persisted.tokensUsed,
        tokensLimit: persisted.tokensLimit,
        status: 'active',
      })
    }
  }, [])

  const saveKey = useCallback((rawKey: string, provider: ByokProvider) => {
    const masked = maskKey(rawKey, provider)
    const next: PersistedState = {
      provider,
      maskedKey: masked,
      tokensUsed: 0,
      tokensLimit: DEFAULT_LIMIT,
    }
    writeState(next)
    setState({
      provider,
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
      provider: DEFAULT_PROVIDER,
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
