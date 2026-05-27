'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coachApi, type CoachByokStateDto, type CoachProviderEnum } from '@/lib/api'

export type ByokProvider = 'openai' | 'anthropic'
export type ByokStatus = 'active' | 'unset'

export interface ByokState {
  provider: ByokProvider
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
  status: ByokStatus
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

const QUERY_KEY = ['coach', 'byok-key'] as const

function toClientProvider(p: CoachProviderEnum | null | undefined): ByokProvider {
  return p === 'ANTHROPIC' ? 'anthropic' : 'openai'
}

function toServerProvider(p: ByokProvider): CoachProviderEnum {
  return p === 'anthropic' ? 'ANTHROPIC' : 'OPENAI'
}

function mapStateDto(dto: CoachByokStateDto | undefined | null): ByokState {
  if (!dto || dto.status !== 'active') {
    return {
      provider: DEFAULT_PROVIDER,
      maskedKey: null,
      tokensUsed: 0,
      tokensLimit: DEFAULT_LIMIT,
      status: 'unset',
    }
  }
  return {
    provider: toClientProvider(dto.provider),
    maskedKey: dto.maskedKey,
    tokensUsed: dto.tokensUsed ?? 0,
    tokensLimit: dto.tokensLimit ?? DEFAULT_LIMIT,
    status: 'active',
  }
}

export function useByokKey() {
  const queryClient = useQueryClient()

  const query = useQuery<ByokState>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await coachApi.getByokKey()
      return mapStateDto(res.data)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (vars: { rawKey: string; provider: ByokProvider }) => {
      const res = await coachApi.saveByokKey({
        provider: toServerProvider(vars.provider),
        apiKey: vars.rawKey,
      })
      return mapStateDto(res.data)
    },
    onSuccess: (next) => {
      queryClient.setQueryData<ByokState>(QUERY_KEY, next)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await coachApi.deleteByokKey()
    },
    onSuccess: () => {
      queryClient.setQueryData<ByokState>(QUERY_KEY, {
        provider: DEFAULT_PROVIDER,
        maskedKey: null,
        tokensUsed: 0,
        tokensLimit: DEFAULT_LIMIT,
        status: 'unset',
      })
      // Invalidate any related Coach queries since prior keys are gone.
      queryClient.invalidateQueries({ queryKey: ['coach'] })
    },
  })

  const state: ByokState = query.data ?? {
    provider: DEFAULT_PROVIDER,
    maskedKey: null,
    tokensUsed: 0,
    tokensLimit: DEFAULT_LIMIT,
    status: 'unset',
  }

  const saveKey = useCallback(
    (rawKey: string, provider: ByokProvider) => {
      // Return the same { success, maskedKey } shape consumers expect.
      return saveMutation
        .mutateAsync({ rawKey, provider })
        .then((next) => ({ success: true as const, maskedKey: next.maskedKey }))
        .catch((err) => {
          return { success: false as const, maskedKey: null as string | null, error: err }
        })
    },
    [saveMutation],
  )

  const deleteKey = useCallback(() => {
    return deleteMutation.mutateAsync().catch(() => {
      /* best-effort delete */
    })
  }, [deleteMutation])

  return {
    ...state,
    saveKey,
    deleteKey,
  }
}
