import type { ExcalidrawScene } from './types'

const DRAFT_PREFIX = 'dw-whiteboard-draft:'

export function saveWhiteboardDraft(id: string, scene: ExcalidrawScene): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(scene))
  } catch {
    // quota or private mode
  }
}

export function loadWhiteboardDraft(id: string): ExcalidrawScene | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw) as ExcalidrawScene
  } catch {
    return null
  }
}

export function clearWhiteboardDraft(id: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${id}`)
  } catch {
    // ignore
  }
}

export function resolveWhiteboardScene(
  id: string,
  serverContent: ExcalidrawScene | null,
): ExcalidrawScene | null {
  if (serverContent !== null) return serverContent
  return loadWhiteboardDraft(id)
}