'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [initialWidth, setInitialWidth] = useState(0)
  const [initialX, setInitialX] = useState(0)
  const [currentWidth, setCurrentWidth] = useState<number | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setInitialX(e.clientX)
      setInitialWidth(imageRef.current?.offsetWidth || 0)
      setCurrentWidth(imageRef.current?.offsetWidth || 0)
    },
    []
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - initialX
      const newWidth = Math.max(100, initialWidth + diff)
      setCurrentWidth(newWidth)
      updateAttributes({ width: newWidth })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, initialX, initialWidth, updateAttributes])

  // Track width from attrs
  useEffect(() => {
    if (node.attrs.width) {
      setCurrentWidth(node.attrs.width)
    }
  }, [node.attrs.width])

  const width = node.attrs.width
  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : undefined

  return (
    <NodeViewWrapper className="my-4" ref={containerRef}>
      <div
        className={cn(
          'group relative inline-block',
          selected && 'rounded-lg ring-2 ring-primary ring-offset-2'
        )}
        style={{ width: widthStyle, maxWidth: '100%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title}
          className="block h-auto max-w-full rounded-lg border-2 border-border"
          style={{ width: widthStyle, display: 'block' }}
          draggable={false}
        />

        {/* Resize handles - only show when selected */}
        {selected && (
          <>
            {/* Left handle */}
            <div
              className="absolute bottom-0 left-0 top-0 flex w-3 cursor-ew-resize items-center justify-center rounded-l-lg bg-primary/20 opacity-0 transition-opacity hover:bg-primary/40 group-hover:opacity-100"
              style={{ zIndex: 10 }}
              onMouseDown={handleMouseDown}
            >
              <div className="h-8 w-1 rounded-full bg-primary" />
            </div>

            {/* Right handle */}
            <div
              className="absolute bottom-0 right-0 top-0 flex w-3 cursor-ew-resize items-center justify-center rounded-r-lg bg-primary/20 opacity-0 transition-opacity hover:bg-primary/40 group-hover:opacity-100"
              style={{ zIndex: 10 }}
              onMouseDown={handleMouseDown}
            >
              <div className="h-8 w-1 rounded-full bg-primary" />
            </div>

            {/* Size indicator */}
            {currentWidth && (
              <div 
                className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                style={{ zIndex: 10 }}
              >
                {Math.round(currentWidth)}px
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const ResizableImage = Node.create({
  name: 'image',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})

export default ResizableImage
