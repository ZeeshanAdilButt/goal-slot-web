import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { whiteboardsApi } from '@/lib/api/whiteboards'

import {
  CreateWhiteboardDto,
  SharedWithMeItem,
  UpdateWhiteboardDto,
  Whiteboard,
} from '../types'

export const WHITEBOARDS_QUERY_KEY = ['whiteboards']
export const SHARED_WHITEBOARDS_QUERY_KEY = ['whiteboards', 'shared-with-me']

export function useWhiteboardsQuery() {
  return useQuery({
    queryKey: WHITEBOARDS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await whiteboardsApi.getAll()
      return data as Whiteboard[]
    },
  })
}

export function useWhiteboardQuery(id: string | null) {
  return useQuery({
    queryKey: [...WHITEBOARDS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await whiteboardsApi.getOne(id)
      return data as { whiteboard: Whiteboard; readOnly: boolean }
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useSharedWhiteboardsQuery() {
  return useQuery({
    queryKey: SHARED_WHITEBOARDS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await whiteboardsApi.sharedWithMe()
      return data as SharedWithMeItem[]
    },
  })
}

export function useCreateWhiteboardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWhiteboardDto) => {
      const response = await whiteboardsApi.create(data)
      return response.data as Whiteboard
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: WHITEBOARDS_QUERY_KEY })
      const previous = queryClient.getQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY)
      const tmpId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()
      const optimistic: Whiteboard = {
        id: tmpId,
        title: data.title,
        content: null,
        icon: data.icon,
        color: data.color,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
        userId: '',
      }
      queryClient.setQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY, (prev) => [...(prev ?? []), optimistic])
      return { previous, tmpId }
    },
    onSuccess: (newWhiteboard, _vars, context) => {
      queryClient.setQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY, (prev) => {
        if (!prev) return prev
        const tmpId = context?.tmpId
        if (!tmpId) return [...prev.filter((w) => w.id !== newWhiteboard.id), newWhiteboard]
        return prev.map((w) => (w.id === tmpId ? newWhiteboard : w))
      })
      queryClient.invalidateQueries({ queryKey: WHITEBOARDS_QUERY_KEY, refetchType: 'inactive' })
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WHITEBOARDS_QUERY_KEY, context.previous)
      }
      toast.error(error.response?.data?.message || 'Failed to create whiteboard')
    },
  })
}

export function useUpdateWhiteboardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWhiteboardDto }) => {
      const response = await whiteboardsApi.update(id, data)
      return response.data as Whiteboard
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: WHITEBOARDS_QUERY_KEY })
      const detailKey = [...WHITEBOARDS_QUERY_KEY, id] as const
      const previousList = queryClient.getQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY)
      const previousDetail = queryClient.getQueryData<{ whiteboard: Whiteboard; readOnly: boolean }>(
        detailKey,
      )
      const previousShared = queryClient.getQueryData<SharedWithMeItem[]>(SHARED_WHITEBOARDS_QUERY_KEY)

      queryClient.setQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY, (prev) => {
        if (!prev) return prev
        return prev.map((w) => (w.id === id ? { ...w, ...data } : w))
      })

      queryClient.setQueryData<{ whiteboard: Whiteboard; readOnly: boolean }>(detailKey, (prev) => {
        if (!prev) return prev
        return { ...prev, whiteboard: { ...prev.whiteboard, ...data } }
      })

      if (data.title !== undefined || data.icon !== undefined || data.color !== undefined) {
        queryClient.setQueryData<SharedWithMeItem[]>(SHARED_WHITEBOARDS_QUERY_KEY, (prev) => {
          if (!prev) return prev
          return prev.map((item) =>
            item.whiteboard.id === id
              ? {
                  ...item,
                  whiteboard: {
                    ...item.whiteboard,
                    ...(data.title !== undefined ? { title: data.title } : {}),
                    ...(data.icon !== undefined ? { icon: data.icon } : {}),
                    ...(data.color !== undefined ? { color: data.color } : {}),
                  },
                }
              : item,
          )
        })
      }

      return { previousList, previousDetail, previousShared, id }
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(WHITEBOARDS_QUERY_KEY, context.previousList)
      }
      if (context?.previousDetail) {
        queryClient.setQueryData([...WHITEBOARDS_QUERY_KEY, id], context.previousDetail)
      }
      if (context?.previousShared) {
        queryClient.setQueryData(SHARED_WHITEBOARDS_QUERY_KEY, context.previousShared)
      }
      toast.error(error.response?.data?.message || 'Failed to update whiteboard')
    },
    onSettled: (_data, _error, { id }) => {
      // Defer refetch while queries are active — avoids Excalidraw onChange loops.
      queryClient.invalidateQueries({ queryKey: WHITEBOARDS_QUERY_KEY, refetchType: 'inactive' })
      queryClient.invalidateQueries({
        queryKey: [...WHITEBOARDS_QUERY_KEY, id],
        refetchType: 'inactive',
      })
      queryClient.invalidateQueries({
        queryKey: SHARED_WHITEBOARDS_QUERY_KEY,
        refetchType: 'inactive',
      })
    },
  })
}

export function useDeleteWhiteboardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await whiteboardsApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WHITEBOARDS_QUERY_KEY })
      toast.success('Whiteboard deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete whiteboard')
    },
  })
}
