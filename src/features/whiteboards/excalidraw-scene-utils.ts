import { restoreAppState, restoreElements } from '@excalidraw/excalidraw'

import type { ExcalidrawScene } from './types'

/** Strip editor-session noise; keep only paint-affecting appState. */
function pickPersistedAppState(appState: Record<string, unknown> | undefined) {
  if (!appState) return {}
  const { theme, viewBackgroundColor, gridSize, gridModeEnabled } = appState
  return {
    ...(theme !== undefined ? { theme } : {}),
    ...(viewBackgroundColor !== undefined ? { viewBackgroundColor } : {}),
    ...(gridSize !== undefined ? { gridSize } : {}),
    ...(gridModeEnabled !== undefined ? { gridModeEnabled } : {}),
  }
}

export function prepareExcalidrawScene(
  scene: ExcalidrawScene | null,
  options?: { zenMode?: boolean },
) {
  if (!scene?.elements?.length) {
    return {
      elements: [],
      appState: {
        collaborators: new Map(),
        showWelcomeScreen: false,
        zenModeEnabled: options?.zenMode ?? false,
      },
      files: (scene?.files ?? {}) as Record<string, never>,
    }
  }

  try {
    const liveElements = (scene.elements as any[]).filter((el) => !el?.isDeleted)
    const elements = restoreElements(liveElements, null)
    const appState = restoreAppState(pickPersistedAppState(scene.appState) as any, {
      showWelcomeScreen: false,
      zenModeEnabled: options?.zenMode ?? false,
    })

    return {
      elements,
      appState: {
        ...appState,
        collaborators: new Map(),
        showWelcomeScreen: false,
      },
      files: (scene.files ?? {}) as Record<string, never>,
    }
  } catch {
    return {
      elements: [],
      appState: {
        collaborators: new Map(),
        showWelcomeScreen: false,
        zenModeEnabled: options?.zenMode ?? false,
      },
      files: (scene.files ?? {}) as Record<string, never>,
    }
  }
}

export function sceneMountKey(scene: ExcalidrawScene | null): string {
  if (!scene?.elements?.length) return 'empty'
  return scene.elements.map((el) => String(el.id)).join('-')
}
