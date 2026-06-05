'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { PanelLeft, PanelLeftClose, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { useSharedWhiteboardsQuery, useWhiteboardQuery, WHITEBOARDS_QUERY_KEY } from '../hooks/use-whiteboards'
import { useWhiteboardsSelection } from '../hooks/use-whiteboards-selection'
import type { SharedWithMeItem } from '../types'
import type { FlushWhiteboardSave } from '../WhiteboardCanvas'
import { resolveWhiteboardScene } from '../whiteboard-draft'
import {
  EmptyWhiteboardPanel,
  OwnedWhiteboardPanel,
  SharedWhiteboardPanel,
} from './whiteboards-main-panel'
import { SharedWhiteboardsPanel } from './shared-whiteboards-panel'
import { WhiteboardsSidebar } from './whiteboards-sidebar'

interface WhiteboardsPageProps {
  initialWhiteboardId?: string
}

const SIDEBAR_MIN = 240
const SIDEBAR_MAX = 420
const SIDEBAR_DEFAULT = 288

export function WhiteboardsPage({ initialWhiteboardId }: WhiteboardsPageProps = {}) {
  const isMobile = useIsMobile()
  const { selectedWhiteboard, selectWhiteboard, createWhiteboard, isCreating, deleteSelectedWhiteboard } =
    useWhiteboardsSelection({ initialWhiteboardId })
  const queryClient = useQueryClient()

  const [selectedShared, setSelectedShared] = useState<SharedWithMeItem | null>(null)
  const [focusTitleId, setFocusTitleId] = useState<string | null>(null)
  const sharedFetch = useWhiteboardQuery(selectedShared?.whiteboard.id ?? null)
  const sharedWhiteboard = sharedFetch.data?.whiteboard ?? null
  const sharedReadOnly = sharedFetch.data?.readOnly ?? true

  const { data: sharedList = [] } = useSharedWhiteboardsQuery()

  const ownedWhiteboardId = selectedShared ? null : (selectedWhiteboard?.id ?? null)
  const ownedFetch = useWhiteboardQuery(ownedWhiteboardId)
  const flushCanvasSaveRef = useRef<FlushWhiteboardSave | null>(null)

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const handledActionRef = useRef(false)
  const handledSharedRef = useRef(false)
  const prevCreatingRef = useRef(false)

  useEffect(() => {
    if (isMobile && isMobileSidebarOpen && (selectedWhiteboard || selectedShared)) {
      setIsMobileSidebarOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWhiteboard?.id, selectedShared?.shareId])

  useEffect(() => {
    if (handledActionRef.current) return
    if (searchParams?.get('action') !== 'new') return
    handledActionRef.current = true
    createWhiteboard()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('action')
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }, [createWhiteboard, pathname, router, searchParams])

  useEffect(() => {
    if (handledSharedRef.current) return
    const sharedId = searchParams?.get('shared')
    if (!sharedId) return
    const match = sharedList.find((s) => s.whiteboard.id === sharedId)
    if (!match) return
    handledSharedRef.current = true
    setSelectedShared(match)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('shared')
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }, [pathname, router, searchParams, sharedList])

  useEffect(() => {
    if (isCreating && !prevCreatingRef.current && selectedWhiteboard) {
      setFocusTitleId(selectedWhiteboard.id)
    }
    prevCreatingRef.current = isCreating
  }, [isCreating, selectedWhiteboard])

  useEffect(() => {
    return () => {
      void flushCanvasSaveRef.current?.()
    }
  }, [])

  const handleSelectOwned = async (wb: Parameters<typeof selectWhiteboard>[0]) => {
    await flushCanvasSaveRef.current?.()
    setSelectedShared(null)
    selectWhiteboard(wb)
    // Force refetch so we get latest saved content
    await queryClient.invalidateQueries({
      queryKey: [...WHITEBOARDS_QUERY_KEY, wb.id],
    })
  }

  const handleSelectShared = async (summary: SharedWithMeItem) => {
    await flushCanvasSaveRef.current?.()
    setSelectedShared(summary)
  }

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (event: MouseEvent) => {
      const next = Math.min(Math.max(SIDEBAR_MIN, startWidth + (event.clientX - startX)), SIDEBAR_MAX)
      setSidebarWidth(next)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const renderSidebarColumn = (className?: string) => (
    <div className={cn('flex h-full flex-col', className)}>
      <WhiteboardsSidebar
        selectedWhiteboardId={selectedShared ? null : (selectedWhiteboard?.id ?? null)}
        onSelectWhiteboard={handleSelectOwned}
        onAfterDeleteSelected={deleteSelectedWhiteboard}
        focusTitleId={focusTitleId}
        className="min-h-0 flex-1"
      />
      <SharedWhiteboardsPanel
        selectedShareId={selectedShared?.shareId ?? null}
        onSelectShared={handleSelectShared}
        className="shrink-0"
      />
    </div>
  )

  const registerFlush = (fn: FlushWhiteboardSave | null) => {
    flushCanvasSaveRef.current = fn
  }

  let mainContent: React.ReactNode

  if (selectedShared) {
    if (sharedWhiteboard) {
      const resolvedSharedContent = resolveWhiteboardScene(
        sharedWhiteboard.id,
        sharedWhiteboard.content,
      )
      const waitingForSharedContent =
        sharedFetch.isFetching && !(resolvedSharedContent?.elements?.length ?? 0)

      mainContent = (
        <SharedWhiteboardPanel
          key={`shared-${selectedShared.shareId}`}
          shared={selectedShared}
          whiteboard={sharedWhiteboard}
          readOnly={sharedReadOnly}
          waitingForContent={waitingForSharedContent}
          resolvedContent={resolvedSharedContent}
          onRegisterFlush={registerFlush}
        />
      )
    } else if (sharedFetch.isLoading) {
      mainContent = (
        <div className="flex h-full items-center justify-center">
          <Loading size="md" />
        </div>
      )
    } else {
      mainContent = (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-zinc-500">
          <span>This shared whiteboard is no longer available.</span>
          <Button variant="secondary" size="sm" onClick={() => setSelectedShared(null)}>
            Back to my whiteboards
          </Button>
        </div>
      )
    }
  } else if (selectedWhiteboard) {
    const displayWhiteboard = ownedFetch.data?.whiteboard ?? selectedWhiteboard
    const resolvedContent = resolveWhiteboardScene(displayWhiteboard.id, displayWhiteboard.content)
    const hasElements = (resolvedContent?.elements?.length ?? 0) > 0
    const waitingForServer =
      !!ownedWhiteboardId &&
      ownedFetch.isFetching &&
      !hasElements &&
      !resolveWhiteboardScene(selectedWhiteboard.id, selectedWhiteboard.content)?.elements?.length

    mainContent = (
      <OwnedWhiteboardPanel
        key={selectedWhiteboard.id}
        displayWhiteboard={displayWhiteboard}
        resolvedContent={resolvedContent}
        waitingForServer={waitingForServer}
        focusTitleId={focusTitleId}
        onRegisterFlush={registerFlush}
      />
    )
  } else {
    mainContent = (
      <EmptyWhiteboardPanel
        isMobile={isMobile}
        isCreating={isCreating}
        onCreate={createWhiteboard}
      />
    )
  }

  const headerTitle = selectedShared
    ? selectedShared.whiteboard.title || 'Untitled'
    : selectedWhiteboard?.title || 'Untitled'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-2 sm:h-10">
        <div className="flex min-w-0 items-center gap-2">
          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen((o) => !o)}
              aria-label={isMobileSidebarOpen ? 'Close whiteboards list' : 'Open whiteboards list'}
            >
              {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              <span className="text-xs">{isMobileSidebarOpen ? 'Close' : 'Whiteboards'}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed((c) => !c)}
              aria-label={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              <span className="text-xs">{isSidebarCollapsed ? 'Show whiteboards' : 'Hide sidebar'}</span>
            </Button>
          )}
          {isMobile && !isMobileSidebarOpen && (selectedWhiteboard || selectedShared) && (
            <span className="truncate text-sm font-medium text-zinc-700">{headerTitle}</span>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={createWhiteboard} disabled={isCreating}>
          {isCreating ? <Loading size="sm" /> : <Plus className="h-4 w-4" />}
          <span className="text-xs">{isCreating ? 'Creating...' : 'New whiteboard'}</span>
        </Button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {isMobile ? (
          <>
            <div
              className={cn(
                'absolute inset-y-0 left-0 z-20 flex w-[min(85vw,320px)] flex-col border-r border-zinc-200 bg-white transition-transform duration-200',
                isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
              )}
            >
              {renderSidebarColumn('h-full')}
            </div>
            {isMobileSidebarOpen && (
              <button
                aria-label="Close sidebar"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 z-10 bg-zinc-950/30 backdrop-blur-[2px]"
              />
            )}
          </>
        ) : (
          <>
            <div
              className={cn(
                'shrink-0 border-r border-zinc-200 bg-white transition-[width] duration-200',
                isSidebarCollapsed && 'overflow-hidden border-r-0',
              )}
              style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
            >
              {renderSidebarColumn('h-full')}
            </div>
            {!isSidebarCollapsed && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={handleStartResize}
                className="group relative w-1 cursor-col-resize bg-transparent transition-colors hover:bg-[#f2cc0d]/30"
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200 transition-colors group-hover:bg-[#f2cc0d]" />
              </div>
            )}
          </>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">{mainContent}</div>
      </div>
    </div>
  )
}
