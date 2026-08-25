'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { cliAuthApi, type CliToken } from '@/lib/api'

export const CLI_TOKENS_QUERY_KEY = ['cli-tokens'] as const

/**
 * CLI tokens for the Settings tab.
 *
 * The list deliberately includes tokens revoked in the last 30 days (the API
 * decides the window). A token revoked as REUSE_DETECTED means the API saw the
 * same refresh token presented twice, which is the one event on this screen the
 * user genuinely needs to see rather than have quietly disappear.
 */
export function useCliTokens() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CLI_TOKENS_QUERY_KEY })

  const { data, isLoading, isError } = useQuery({
    queryKey: CLI_TOKENS_QUERY_KEY,
    queryFn: async (): Promise<CliToken[]> => {
      const { data } = await cliAuthApi.listTokens()
      return data
    },
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cliAuthApi.renameToken(id, name),
    onSuccess: invalidate,
  })

  const revoke = useMutation({
    mutationFn: (id: string) => cliAuthApi.revokeToken(id),
    onSuccess: invalidate,
  })

  const revokeAll = useMutation({
    mutationFn: () => cliAuthApi.revokeAllTokens(),
    onSuccess: invalidate,
  })

  const tokens = data ?? []

  return {
    tokens,
    activeTokens: tokens.filter((token) => !token.revokedAt),
    revokedTokens: tokens.filter((token) => token.revokedAt),
    isLoading,
    isError,
    rename,
    revoke,
    revokeAll,
  }
}
