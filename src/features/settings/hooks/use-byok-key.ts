'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coachApi, type CoachByokStateDto, type CoachProviderEnum } from '@/lib/api'

export type ByokProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter'
export type ByokStatus = 'active' | 'unset'

export interface SharedSummary {
  available: boolean
  used: number
  limit: number
}

export interface ByokState {
  provider: ByokProvider
  maskedKey: string | null
  tokensUsed: number
  tokensLimit: number
  status: ByokStatus
  selectedModel: string | null
  allowedModels: string[]
  effectiveModel: string | null
  /** When status is 'unset' but shared.available is true, the Coach can
   *  still answer using the operator-provided shared Gemini Flash key. */
  shared: SharedSummary
}

const DEFAULT_LIMIT = 100000
const DEFAULT_PROVIDER: ByokProvider = 'openai'

export const PROVIDER_META: Record<
  ByokProvider,
  {
    label: string
    placeholder: string
    consoleUrl: string
    prefix: string
    /** True when the provider has a usable free tier with no credit card. */
    isFree: boolean
    /** One-line "how to get a key" walk-through shown next to the input. */
    howTo: string
  }
> = {
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    isFree: false,
    howTo:
      'Open platform.openai.com, sign in, click Create new secret key, copy and paste it here. You will need a billing card on file.',
  },
  anthropic: {
    label: 'Anthropic',
    placeholder: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
    isFree: false,
    howTo:
      'Open console.anthropic.com, go to API Keys, click Create Key, copy and paste it here. You will need a billing card on file.',
  },
  gemini: {
    label: 'Google Gemini',
    placeholder: 'AIza...',
    consoleUrl: 'https://aistudio.google.com/apikey',
    prefix: 'AIza',
    isFree: true,
    howTo:
      'Open aistudio.google.com/apikey, sign in with any Google account, click Create API key, copy and paste it here. No credit card needed.',
  },
  openrouter: {
    label: 'OpenRouter',
    placeholder: 'sk-or-...',
    consoleUrl: 'https://openrouter.ai/keys',
    prefix: 'sk-or-',
    isFree: true,
    howTo:
      'Open openrouter.ai, sign up, go to Keys, click Create Key, copy and paste it here. Pick a model with :free in its name to stay on the free tier.',
  },
}

const QUERY_KEY = ['coach', 'byok-key'] as const

function toClientProvider(p: CoachProviderEnum | null | undefined): ByokProvider {
  if (p === 'ANTHROPIC') return 'anthropic'
  if (p === 'GEMINI') return 'gemini'
  if (p === 'OPENROUTER') return 'openrouter'
  return 'openai'
}

function toServerProvider(p: ByokProvider): CoachProviderEnum {
  if (p === 'anthropic') return 'ANTHROPIC' as CoachProviderEnum
  if (p === 'gemini') return 'GEMINI' as CoachProviderEnum
  if (p === 'openrouter') return 'OPENROUTER' as CoachProviderEnum
  return 'OPENAI' as CoachProviderEnum
}

const EMPTY_SHARED: SharedSummary = { available: false, used: 0, limit: 0 }

function mapStateDto(dto: CoachByokStateDto | undefined | null): ByokState {
  const shared: SharedSummary = (dto as any)?.shared ?? EMPTY_SHARED
  if (!dto || dto.status !== 'active') {
    return {
      provider: DEFAULT_PROVIDER,
      maskedKey: null,
      tokensUsed: 0,
      tokensLimit: DEFAULT_LIMIT,
      status: 'unset',
      selectedModel: null,
      allowedModels: [],
      effectiveModel: null,
      shared,
    }
  }
  return {
    provider: toClientProvider(dto.provider),
    maskedKey: dto.maskedKey,
    tokensUsed: dto.tokensUsed ?? 0,
    tokensLimit: dto.tokensLimit ?? DEFAULT_LIMIT,
    status: 'active',
    selectedModel: dto.selectedModel ?? null,
    allowedModels: dto.allowedModels ?? [],
    effectiveModel: dto.effectiveModel ?? null,
    shared,
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

  const budgetMutation = useMutation({
    mutationFn: async (tokensLimit: number) => {
      const res = await coachApi.updateByokBudget(tokensLimit)
      return mapStateDto(res.data)
    },
    onSuccess: (next) => {
      queryClient.setQueryData<ByokState>(QUERY_KEY, next)
    },
  })

  const modelMutation = useMutation({
    mutationFn: async (model: string) => {
      const res = await coachApi.updateByokModel(model)
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
        selectedModel: null,
        allowedModels: [],
        effectiveModel: null,
        shared: EMPTY_SHARED,
      })
      // Invalidate any related Coach queries since prior keys are gone.
      queryClient.invalidateQueries({ queryKey: ['coach'] })
      // Also re-fetch byok-key so the fresh shared usage summary lands.
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const state: ByokState = query.data ?? {
    provider: DEFAULT_PROVIDER,
    maskedKey: null,
    tokensUsed: 0,
    tokensLimit: DEFAULT_LIMIT,
    status: 'unset',
    selectedModel: null,
    allowedModels: [],
    effectiveModel: null,
    shared: EMPTY_SHARED,
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

  const updateBudget = useCallback(
    (tokensLimit: number) => {
      return budgetMutation
        .mutateAsync(tokensLimit)
        .then(() => ({ success: true as const }))
        .catch((err) => ({ success: false as const, error: err }))
    },
    [budgetMutation],
  )

  const updateModel = useCallback(
    (model: string) =>
      modelMutation
        .mutateAsync(model)
        .then(() => ({ success: true as const }))
        .catch((err) => ({ success: false as const, error: err })),
    [modelMutation],
  )

  return {
    ...state,
    // `isLoading` is true on the very first fetch — consumers should
    // gate the "no key saved" UI on it, otherwise that branch flashes
    // for one render before the real data arrives. `isResolved` is the
    // friendlier inverse for the same purpose.
    isLoading: query.isLoading,
    isResolved: !query.isLoading,
    saveKey,
    deleteKey,
    updateBudget,
    isUpdatingBudget: budgetMutation.isPending,
    updateModel,
    isUpdatingModel: modelMutation.isPending,
  }
}
