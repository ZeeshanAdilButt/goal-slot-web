import type { ExcalidrawScene } from './types'

/**
 * Build the scene we persist from what Excalidraw hands us.
 *
 * Excalidraw's `onChange` is called with `getElementsIncludingDeleted()` and
 * with its raw file map — it prunes neither. So:
 *
 *  - deleted elements are persisted as tombstones, and
 *  - the base64 blob of a deleted image stays in `files` forever. It is
 *    loaded straight back in through `initialData.files` on the next open
 *    and re-saved, so "delete the big image" never shrinks the board.
 *
 * `Whiteboard.content` is hard-capped at 2 MB server-side and every autosave
 * rewrites the whole jsonb row (a new tuple, a new TOAST chain and WAL under
 * Postgres MVCC), so an unpruned board costs storage forever. Pruning here
 * also makes the two save paths agree: `flushSave` reads
 * `api.getSceneElements()`, which already excludes tombstones.
 */
export function buildScene(
  elements: readonly Record<string, unknown>[],
  appState: Record<string, unknown>,
  files: Record<string, unknown> = {},
): ExcalidrawScene {
  const {
    collaborators: _c,
    editingElement: _e,
    draggingElement: _d,
    openMenu: _m,
    openPopup: _p,
    contextMenu: _ctx,
    ...persistedAppState
  } = appState

  const liveElements = (elements as Record<string, unknown>[]).filter((el) => !el?.isDeleted)

  const referencedFileIds = new Set<string>()
  for (const el of liveElements) {
    const fileId = el?.fileId
    if (typeof fileId === 'string') referencedFileIds.add(fileId)
  }

  const prunedFiles: Record<string, unknown> = {}
  for (const [fileId, file] of Object.entries(files ?? {})) {
    if (referencedFileIds.has(fileId)) prunedFiles[fileId] = file
  }

  return {
    elements: liveElements,
    appState: persistedAppState,
    files: prunedFiles,
  }
}

/**
 * Guard against overwriting a real board with an empty one.
 *
 * Scene content is loaded from the detail query. If that request fails the
 * canvas still mounts, just with nothing in it — and the first autosave would
 * then PUT an empty scene over the user's actual board. Permanent data loss,
 * silently.
 *
 * `knownNonEmpty` is true once this canvas session has actually held content
 * (it mounted with some, or we successfully persisted some), so a user who
 * genuinely selects everything and deletes it still has that saved.
 */
export function isSceneSafeToPersist(scene: Pick<ExcalidrawScene, 'elements'>, knownNonEmpty: boolean): boolean {
  if (scene.elements.length > 0) return true
  return knownNonEmpty
}
