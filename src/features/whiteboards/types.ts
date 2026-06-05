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
