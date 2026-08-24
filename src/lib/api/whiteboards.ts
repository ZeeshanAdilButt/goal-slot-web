import axios from 'axios'

import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Public endpoints — no auth header or 401 refresh interceptor. */
const publicApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

import type {
  ExcalidrawScene,
  SharedWithMeItem,
  Whiteboard,
  WhiteboardShareState,
  WhiteboardWithAccess,
} from '@/features/whiteboards/types'

export async function getWhiteboards(): Promise<Whiteboard[]> {
  const { data } = await api.get('/whiteboards')
  return data as Whiteboard[]
}

export async function getWhiteboard(id: string): Promise<WhiteboardWithAccess> {
  const { data } = await api.get(`/whiteboards/${id}`)
  return data as WhiteboardWithAccess
}

export async function createWhiteboard(data: {
  title: string
  icon?: string
  color?: string
}): Promise<Whiteboard> {
  const { data: created } = await api.post('/whiteboards', data)
  return created as Whiteboard
}

export async function updateWhiteboard(
  id: string,
  data: Partial<{
    title: string
    content: ExcalidrawScene
    icon: string
    color: string
    isFavorite: boolean
  }>,
): Promise<Whiteboard> {
  const { data: updated } = await api.put(`/whiteboards/${id}`, data)
  return updated as Whiteboard
}

/** Best-effort save during page unload (fetch keepalive, ~64 KB limit). Never throws. */
export function updateWhiteboardKeepalive(
  id: string,
  content: ExcalidrawScene,
): void {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('accessToken')
  if (!token || !API_URL) return

  const body = JSON.stringify({ content })
  if (body.length > 60_000) return

  let url: string
  try {
    url = new URL(`/api/whiteboards/${encodeURIComponent(id)}`, API_URL).href
  } catch {
    return
  }

  fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Network/CORS failures are expected during unload; session draft is the fallback.
  })
}

export async function deleteWhiteboard(id: string): Promise<void> {
  await api.delete(`/whiteboards/${id}`)
}

export async function getSharedWithMe(): Promise<SharedWithMeItem[]> {
  const { data } = await api.get('/whiteboards/shared-with-me')
  return data as SharedWithMeItem[]
}

export async function getShareState(id: string): Promise<WhiteboardShareState> {
  const { data } = await api.get(`/whiteboards/${id}/share`)
  return data as WhiteboardShareState
}

export async function enablePublicLink(id: string): Promise<{ token: string }> {
  const { data } = await api.post(`/whiteboards/${id}/share/public-link`)
  return data as { token: string }
}

export async function revokePublicLink(id: string): Promise<void> {
  await api.delete(`/whiteboards/${id}/share/public-link`)
}

export async function inviteUser(id: string, email: string): Promise<void> {
  await api.post(`/whiteboards/${id}/share/invite`, { email })
}

export async function revokeInvite(id: string, shareId: string): Promise<void> {
  await api.delete(`/whiteboards/${id}/share/invite/${shareId}`)
}

/** Axios-style API object (mirrors notesApi in api.ts). */
export const whiteboardsApi = {
  getAll: () => api.get('/whiteboards'),
  getOne: (id: string) => api.get(`/whiteboards/${id}`),
  create: (data: { title: string; icon?: string; color?: string }) => api.post('/whiteboards', data),
  update: (
    id: string,
    data: Partial<{
      title: string
      content: ExcalidrawScene
      icon: string
      color: string
      isFavorite: boolean
    }>,
  ) => api.put(`/whiteboards/${id}`, data),
  delete: (id: string) => api.delete(`/whiteboards/${id}`),
  sharedWithMe: () => api.get('/whiteboards/shared-with-me'),
  getShareState: (id: string) => api.get(`/whiteboards/${id}/share`),
  enablePublicLink: (id: string) => api.post(`/whiteboards/${id}/share/public-link`),
  revokePublicLink: (id: string) => api.delete(`/whiteboards/${id}/share/public-link`),
  invite: (id: string, email: string) => api.post(`/whiteboards/${id}/share/invite`, { email }),
  revokeInvite: (id: string, shareId: string) => api.delete(`/whiteboards/${id}/share/invite/${shareId}`),
}

export const publicWhiteboardsApi = {
  getByToken: (token: string) => publicApi.get(`/public/whiteboards/${token}`),
}
