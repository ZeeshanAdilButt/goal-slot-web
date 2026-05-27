'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import {
  coachApi,
  type CoachInsightDto,
  type CoachInsightStatusEnum,
  type CoachInsightStatusFilter,
} from '@/lib/api'

function isAxios404(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404
}

/**
 * React Query hook for Coach Insights. Tolerates 404 (API branch not yet
 * deployed) by returning an empty array so the UI degrades gracefully.
 */
export function useCoachInsights(status: CoachInsightStatusFilter = 'ACTIVE') {
  const queryClient = useQueryClient()

  const queryKey = ['coach', 'insights', status] as const

  const query = useQuery<CoachInsightDto[]>({
    queryKey,
    queryFn: async () => {
      try {
        const res = await coachApi.listInsights(status)
        return res.data ?? []
      } catch (err) {
        if (isAxios404(err)) return []
        throw err
      }
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (vars: { id: string; next: CoachInsightStatusEnum; note?: string }) => {
      const res = await coachApi.updateInsightStatus(vars.id, vars.next, vars.note)
      return res.data
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CoachInsightDto[]>(queryKey)
      queryClient.setQueryData<CoachInsightDto[]>(queryKey, (prev) => {
        const list = prev ?? []
        return list.map((item) =>
          item.id === vars.id ? { ...item, status: vars.next } : item,
        )
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'narrative'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await coachApi.deleteInsight(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CoachInsightDto[]>(queryKey)
      queryClient.setQueryData<CoachInsightDto[]>(queryKey, (prev) => {
        const list = prev ?? []
        return list.filter((item) => item.id !== id)
      })
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] })
    },
  })

  const updateStatus = useCallback(
    (id: string, next: CoachInsightStatusEnum, note?: string) => {
      updateStatusMutation.mutate({ id, next, note })
    },
    [updateStatusMutation],
  )

  const remove = useCallback(
    (id: string) => {
      removeMutation.mutate(id)
    },
    [removeMutation],
  )

  return {
    insights: query.data ?? [],
    isLoaded: !query.isLoading,
    isLoading: query.isLoading,
    updateStatus,
    remove,
  }
}
