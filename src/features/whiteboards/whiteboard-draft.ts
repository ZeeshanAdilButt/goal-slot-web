import type { ExcalidrawScene } from './types'

const DRAFT_PREFIX = 'dw-whiteboard-draft:'

/**
 * Boards whose draft write blew the sessionStorage quota (~5 MB per origin).
 * A board carrying pasted images can be 2 MB on its own, and `setItem` is a
 * synchronous main-thread write — retrying a doomed one on every change is
 * pure jank, so we stop after the first failure for that board.
 */
const quotaBlockedIds = new Set<string>()

export function saveWhiteboardDraft(id: string, scene: ExcalidrawScene): void {
  if (typeof window === 'undefined') return
  if (quotaBlockedIds.has(id)) return
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(scene))
  } catch {
    // Quota exceeded, or private mode. Drop any stale key for this board so we
    // never restore a half-written/older draft over good server content, and
    // stop attempting the write for the rest of this page session.
    quotaBlockedIds.add(id)
    try {
      sessionStorage.removeItem(`${DRAFT_PREFIX}${id}`)
    } catch {
      // ignore
    }
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

/** Test seam only. */
export function __resetWhiteboardDraftQuotaState(): void {
  quotaBlockedIds.clear()
}

/**
 * `!= null` on purpose, not `!== null`: a whiteboard row that carries no scene
 * (a LIST row, or a detail response still in flight) arrives as `undefined`,
 * and a strict null check would return that `undefined` straight through and
 * silently skip the sessionStorage draft fallback.
 */
export function resolveWhiteboardScene(
  id: string,
  serverContent: ExcalidrawScene | null | undefined,
): ExcalidrawScene | null {
  if (serverContent != null) return serverContent
  const draft = loadWhiteboardDraft(id)
  if ((draft?.elements?.length ?? 0) > 0) return draft
  return null
}
