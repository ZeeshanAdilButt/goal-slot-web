'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

interface EditableContentProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  placeholder?: string
  className?: string
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div'
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

export function EditableContent({
  value,
  onChange,
  onKeyDown,
  placeholder = 'Type something...',
  className,
  as: Component = 'div',
  autoFocus = false,
  onFocus,
  onBlur,
}: EditableContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && autoFocus) {
      ref.current.focus()
      // Move cursor to end
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [autoFocus])

  // Sync external value changes
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.textContent || '')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  // Handle copy - allow native selection to work
  const handleCopy = (e: React.ClipboardEvent) => {
    // Don't prevent default - let native copy work
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      // Selection exists, let native copy handle it
      return
    }
  }

  return (
    <Component
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onCopy={handleCopy}
      onFocus={onFocus}
      onBlur={onBlur}
      data-placeholder={placeholder}
      className={cn(
        'outline-none focus:outline-none',
        'cursor-text select-text', // Ensure text is selectable
        'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
        className
      )}
    />
  )
}
