'use client'

// @ts-ignore: CSS module side-effect import
import '@excalidraw/excalidraw/index.css'
// @ts-ignore: CSS module side-effect import
import './whiteboard-excalidraw.css'

import { useMemo, type ComponentProps } from 'react'

import { Excalidraw } from '@excalidraw/excalidraw'

import { prepareExcalidrawScene } from './excalidraw-scene-utils'
import type { ExcalidrawScene } from './types'

type ExcalidrawProps = ComponentProps<typeof Excalidraw>

interface ExcalidrawCanvasInnerProps extends Omit<ExcalidrawProps, 'initialData'> {
  scene: ExcalidrawScene | null
}

export function ExcalidrawCanvasInner({ scene, ...props }: ExcalidrawCanvasInnerProps) {
  const initialData = useMemo(() => prepareExcalidrawScene(scene), [scene])

  return <Excalidraw initialData={initialData} {...props} />
}
