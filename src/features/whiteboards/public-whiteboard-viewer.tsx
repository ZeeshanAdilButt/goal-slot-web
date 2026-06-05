'use client'

// @ts-ignore: CSS module without type declarations
import '@excalidraw/excalidraw/index.css'
// @ts-ignore: CSS module without type declarations
import './whiteboard-excalidraw.css'

import { useMemo } from 'react'

import { Excalidraw } from '@excalidraw/excalidraw'

import { prepareExcalidrawScene, sceneMountKey } from './excalidraw-scene-utils'
import type { ExcalidrawScene } from './types'

const PUBLIC_UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
    export: false as const,
    toggleTheme: false,
  },
} as const

interface PublicWhiteboardViewerProps {
  scene: ExcalidrawScene | null
  className?: string
}

export function PublicWhiteboardViewer({ scene, className }: PublicWhiteboardViewerProps) {
  const mountKey = useMemo(() => sceneMountKey(scene), [scene])
  const initialData = useMemo(() => prepareExcalidrawScene(scene, { zenMode: true }), [scene, mountKey])

  return (
    <div className={className ?? 'public-whiteboard-view min-h-[40vh]'}>
      <Excalidraw
        key={mountKey}
        initialData={initialData}
        viewModeEnabled
        zenModeEnabled
        UIOptions={PUBLIC_UI_OPTIONS}
      />
    </div>
  )
}
