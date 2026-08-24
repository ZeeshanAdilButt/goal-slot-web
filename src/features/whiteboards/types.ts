export interface ExcalidrawScene {
  elements: Record<string, unknown>[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}

export interface Whiteboard {
  id: string
  title: string
  content: ExcalidrawScene | null
  icon?: string
  color?: string
  isFavorite: boolean
  publicShareToken?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * A whiteboard row as returned by the LIST endpoint (`GET /whiteboards`).
 *
 * The list deliberately omits `content`: an Excalidraw scene is capped at
 * 2 MB server-side, so shipping it for every board turned a sidebar fetch
 * into a multi-megabyte response. Scene content comes from the detail
 * query (`GET /whiteboards/:id`) only — never off a list row.
 */
export type WhiteboardSummary = Omit<Whiteboard, 'content'>

export interface WhiteboardWithAccess {
  whiteboard: Whiteboard
  readOnly: boolean
}

export interface WhiteboardShare {
  id: string
  recipientEmail: string
  recipientUserId?: string
  permission: string
  acceptedAt?: string
  createdAt: string
  emailSent?: boolean
  emailError?: string | null
}

export interface WhiteboardShareState {
  publicShareToken: string | null
  shares: WhiteboardShare[]
}

export interface SharedWithMeItem {
  shareId: string
  whiteboard: Pick<Whiteboard, 'id' | 'title' | 'icon' | 'color' | 'updatedAt'>
  owner: { id: string; name: string; email: string; avatar?: string }
  acceptedAt?: string
  createdAt: string
  permission: string
}

export interface CreateWhiteboardDto {
  title: string
  icon?: string
  color?: string
}

export interface UpdateWhiteboardDto {
  title?: string
  content?: ExcalidrawScene
  icon?: string
  color?: string
  isFavorite?: boolean
}
