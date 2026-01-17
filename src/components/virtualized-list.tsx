import { useRef } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'

import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  getItemKey: (item: T, index: number) => string
  estimateSize: number
  renderItem: (props: { item: T; index: number }) => React.ReactNode
  className?: string
  overscan?: number
  height?: number | string
}
/**
 * VirtualizedList - A reusable virtualization component using TanStack Virtual
 *
 * Features:
 * - Automatic dynamic height measurement using measureElement
 * - Efficient rendering of large lists
 * - Handles variable item heights automatically
 *
 * Note: The wrapper div handles measurement internally - no need to attach refs in renderItem
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={myItems}
 *   getItemKey={(item) => item.id}
 *   estimateSize={48}
 *   renderItem={({ item }) => (
 *     <div>{item.name}</div>
 *   )}
 * />
 * ```
 */
export default function VirtualizedList<T>({
  items,
  getItemKey,
  estimateSize,
  renderItem,
  className,
  overscan = 10,
  height,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // Enable automatic measurement of dynamic heights
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{
        contain: 'layout paint',
        height,
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          const key = getItemKey(item, virtualItem.index)

          return (
            <div
              key={key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem({
                item,
                index: virtualItem.index,
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
