'use client'

import '@excalidraw/excalidraw/index.css'
import './whiteboard-excalidraw.css'

import type { ComponentProps } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

export function ExcalidrawCanvasInner(props: ComponentProps<typeof Excalidraw>) {
  return <Excalidraw {...props} />
}
