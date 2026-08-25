'use client'

import { ExternalLink, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { NotionBlockDto } from '@/lib/api'
import { useNotionPageContent } from '@/features/settings/hooks/use-notion-page-content'

interface NotionReferencePanelProps {
  pageId: string | null
  parentPageId?: string | null
  onClose: () => void
  isPaletteOpen?: boolean
  onSelectPageId?: (pageId: string | null) => void
}

interface GroupedListItem {
  text: string
  children?: GroupedBlock[]
}

interface GroupedBlock {
  id: string
  type: string
  text: string
  items?: GroupedListItem[]
  children?: GroupedBlock[]
}

// Group adjacent list items to prevent vertical spacing gaps.
function groupAdjacentListBlocks(blocks: NotionBlockDto[]): GroupedBlock[] {
  const grouped: GroupedBlock[] = []
  let currentList: { type: 'bulleted_list' | 'numbered_list'; items: GroupedListItem[] } | null = null

  for (const block of blocks) {
    const blockChildren = block.children ? groupAdjacentListBlocks(block.children) : undefined
    const itemObj: GroupedListItem = { text: block.text, children: blockChildren }

    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const listType = block.type === 'bulleted_list_item' ? 'bulleted_list' : 'numbered_list'
      if (currentList && currentList.type === listType) {
        currentList.items.push(itemObj)
      } else {
        if (currentList) {
          grouped.push({
            id: `list-${grouped.length}`,
            type: currentList.type,
            text: '',
            items: currentList.items,
          })
        }
        currentList = { type: listType, items: [itemObj] }
      }
    } else {
      if (currentList) {
        grouped.push({
          id: `list-${grouped.length}`,
          type: currentList.type,
          text: '',
          items: currentList.items,
        })
        currentList = null
      }
      grouped.push({
        id: block.id,
        type: block.type,
        text: block.text,
        children: blockChildren,
      })
    }
  }

  if (currentList) {
    grouped.push({
      id: `list-${grouped.length}`,
      type: currentList.type,
      text: '',
      items: currentList.items,
    })
  }

  return grouped
}

function GroupedBlockRenderer({ block }: { block: GroupedBlock }) {
  const text = block.text || ''

  const renderChildren = () => {
    if (!block.children || block.children.length === 0) return null
    return (
      <div className="mt-1 space-y-0.5 border-l border-zinc-100 pl-4">
        {block.children.map((child) => (
          <GroupedBlockRenderer key={child.id} block={child} />
        ))}
      </div>
    )
  }

  switch (block.type) {
    case 'heading_1':
      return (
        <div className="mb-2 mt-5">
          <h2 className="text-xl font-bold text-zinc-900">{text}</h2>
          {renderChildren()}
        </div>
      )
    case 'heading_2':
      return (
        <div className="mb-1.5 mt-4">
          <h3 className="text-lg font-semibold text-zinc-800">{text}</h3>
          {renderChildren()}
        </div>
      )
    case 'heading_3':
      return (
        <div className="mb-1 mt-3">
          <h4 className="text-base font-semibold text-zinc-700">{text}</h4>
          {renderChildren()}
        </div>
      )
    case 'bulleted_list':
      return (
        <ul className="mb-3 ml-5 list-disc space-y-1 text-sm text-zinc-700">
          {block.items?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <span>{item.text}</span>
              {item.children && item.children.length > 0 && (
                <div className="mt-1 space-y-0.5 border-l border-zinc-100 pl-4">
                  {item.children.map((child) => (
                    <GroupedBlockRenderer key={child.id} block={child} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )
    case 'numbered_list':
      return (
        <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm text-zinc-700">
          {block.items?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <span>{item.text}</span>
              {item.children && item.children.length > 0 && (
                <div className="mt-1 space-y-0.5 border-l border-zinc-100 pl-4">
                  {item.children.map((child) => (
                    <GroupedBlockRenderer key={child.id} block={child} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )
    case 'to_do':
      return (
        <div className="py-0.5">
          <div className="flex items-start gap-2 text-sm leading-relaxed text-zinc-700">
            <input type="checkbox" readOnly className="mt-0.5 shrink-0 accent-[#f2cc0d]" />
            <span>{text}</span>
          </div>
          {renderChildren()}
        </div>
      )
    case 'code':
      return (
        <div className="my-2">
          <pre className="overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-800">
            {text}
          </pre>
          {renderChildren()}
        </div>
      )
    case 'quote':
      return (
        <div className="my-2">
          <blockquote className="border-l-2 border-zinc-300 pl-3 text-sm italic text-zinc-600">
            {text}
          </blockquote>
          {renderChildren()}
        </div>
      )
    case 'toggle':
      return (
        <div className="mb-2 py-0.5">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-800 hover:text-zinc-950 focus:outline-none">
              <span className="text-[10px] text-zinc-500 transition-transform group-open:rotate-90">▶</span>
              <span>{text}</span>
            </summary>
            {renderChildren()}
          </details>
        </div>
      )
    case 'table':
      return (
        <div className="my-2 rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-400">
          Table — open in Notion to view
        </div>
      )
    case 'divider':
      return <hr className="my-4 border-zinc-200" />
    case 'paragraph':
    default:
      if (!text && (!block.children || block.children.length === 0)) return <div className="h-3" /> // blank line spacer
      return (
        <div className="mb-2">
          {text && <p className="text-sm leading-relaxed text-zinc-700">{text}</p>}
          {renderChildren()}
        </div>
      )
  }
}

function toNotionUrl(pageId: string) {
  return `https://www.notion.so/${pageId.replace(/-/g, '')}`
}

export function NotionReferencePanel({
  pageId,
  parentPageId,
  onClose,
  isPaletteOpen,
  onSelectPageId,
}: NotionReferencePanelProps) {
  const { data, isLoading, error, refetch } = useNotionPageContent(pageId)

  const groupedBlocks = typeof data?.blocks !== 'undefined' ? groupAdjacentListBlocks(data.blocks) : []

  return (
    <Sheet modal={false} open={!!pageId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-zinc-200 p-0 shadow-2xl sm:max-w-lg"
        hideOverlay
        onEscapeKeyDown={(event) => {
          if (isPaletteOpen) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault()
        }}
      >
        {isLoading && (
          <div className="flex flex-1 items-center justify-center p-8">
            <Loading className="h-6 w-6" />
          </div>
        )}

        {error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="text-sm text-zinc-600">Could not load page content.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {data && (
          <>
            <SheetHeader className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-2">
                {parentPageId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-900"
                    onClick={() => onSelectPageId?.(parentPageId)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Go back</span>
                  </Button>
                )}
                <SheetTitle className="truncate text-base font-semibold text-zinc-900">
                  {data.title}
                </SheetTitle>
              </div>
              <SheetDescription className="sr-only">
                Read-only view of Notion page: {data.title}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {data.contentType === 'database' ? (
                <div className="space-y-1">
                  {!data.pages || data.pages.length === 0 ? (
                    <p className="text-sm text-zinc-400">This database is empty.</p>
                  ) : (
                    data.pages.map((p) => (
                      <button
                        key={p.notionPageId}
                        onClick={() => onSelectPageId?.(p.notionPageId)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="truncate font-medium">{p.title}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : groupedBlocks.length === 0 ? (
                <p className="text-sm text-zinc-400">This page is empty.</p>
              ) : (
                <div className="space-y-0.5">
                  {groupedBlocks.map((block) => (
                    <GroupedBlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 px-5 py-3">
              <a
                href={toNotionUrl(data.pageId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Notion
              </a>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
