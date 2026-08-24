'use client'

import { LayoutGrid, Plus } from 'lucide-react'

import { NOTE_COLORS } from '@/features/notes/utils/types'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

import type { ExcalidrawScene, SharedWithMeItem, Whiteboard, WhiteboardSummary } from '../types'
import { resolveWhiteboardScene } from '../whiteboard-draft'
import { WhiteboardCanvas, type FlushWhiteboardSave } from '../WhiteboardCanvas'
import { WhiteboardHeader } from './whiteboard-header'

function whiteboardColorClass(color?: string) {
  return NOTE_COLORS.find((c) => c.value === (color || 'default'))?.bg ?? NOTE_COLORS[0].bg
}

interface OwnedWhiteboardPanelProps {
  displayWhiteboard: WhiteboardSummary
  resolvedContent: ExcalidrawScene | null
  waitingForServer: boolean
  focusTitleId: string | null
  onRegisterFlush: (fn: FlushWhiteboardSave | null) => void
}

export function OwnedWhiteboardPanel({
  displayWhiteboard,
  resolvedContent,
  waitingForServer,
  focusTitleId,
  onRegisterFlush,
}: OwnedWhiteboardPanelProps) {
  return (
    <div className={cn('flex h-full flex-col', whiteboardColorClass(displayWhiteboard.color))}>
      <WhiteboardHeader
        whiteboard={displayWhiteboard}
        autoFocusTitle={focusTitleId === displayWhiteboard.id}
      />
      <div className="min-h-0 flex-1">
        {waitingForServer ? (
          <div className="flex h-full items-center justify-center">
            <Loading size="md" />
          </div>
        ) : (
          <WhiteboardCanvas
            key={displayWhiteboard.id}
            whiteboardId={displayWhiteboard.id}
            initialData={resolvedContent}
            readOnly={false}
            onRegisterFlush={onRegisterFlush}
          />
        )}
      </div>
    </div>
  )
}

interface SharedWhiteboardPanelProps {
  shared: SharedWithMeItem
  whiteboard: Whiteboard
  readOnly: boolean
  waitingForContent: boolean
  resolvedContent: ExcalidrawScene | null
  onRegisterFlush: (fn: FlushWhiteboardSave | null) => void
}

export function SharedWhiteboardPanel({
  shared,
  whiteboard,
  readOnly,
  waitingForContent,
  resolvedContent,
  onRegisterFlush,
}: SharedWhiteboardPanelProps) {
  return (
    <div className={cn('flex h-full flex-col', whiteboardColorClass(whiteboard.color))}>
      <WhiteboardHeader whiteboard={whiteboard} readOnly={readOnly} sharedBy={shared.owner} />
      <div className="min-h-0 flex-1">
        {waitingForContent ? (
          <div className="flex h-full items-center justify-center">
            <Loading size="md" />
          </div>
        ) : (
          <WhiteboardCanvas
            key={`shared-canvas-${whiteboard.id}-${resolvedContent?.elements?.length ?? 0}`}
            whiteboardId={whiteboard.id}
            initialData={resolvedContent}
            readOnly={readOnly}
            onRegisterFlush={onRegisterFlush}
          />
        )}
      </div>
    </div>
  )
}

interface EmptyWhiteboardPanelProps {
  isMobile: boolean
  isCreating: boolean
  onCreate: () => void
}

export function EmptyWhiteboardPanel({ isMobile, isCreating, onCreate }: EmptyWhiteboardPanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50">
        <LayoutGrid className="h-10 w-10 text-zinc-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-zinc-900">Select a whiteboard or create a new one</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {isMobile
            ? 'Tap the menu to pick a whiteboard or create a new one.'
            : 'Pick a whiteboard from the sidebar or create a new one.'}
        </p>
      </div>
      <Button variant="brand" onClick={onCreate} disabled={isCreating}>
        {isCreating ? <Loading size="sm" /> : <Plus className="h-4 w-4" />}
        {isCreating ? 'Creating...' : 'Create whiteboard'}
      </Button>
    </div>
  )
}
