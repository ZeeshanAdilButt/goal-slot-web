'use client'

import { useState, useRef, useEffect } from 'react'

import { Copy, Check, ChevronDown } from 'lucide-react'

import { CodeBlock } from '../types'
import { useBlockEditorStore } from '../store'

import { cn } from '@/lib/utils'

interface CodeBlockComponentProps {
  block: CodeBlock
  isSelected: boolean
  onSelect: () => void
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
]

export function CodeBlockComponent({ block, isSelected, onSelect }: CodeBlockComponentProps) {
  const { updateBlock } = useBlockEditorStore()
  const [showLanguages, setShowLanguages] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLanguages(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(block.id, { content: e.target.value })
  }

  const handleLanguageChange = (language: string) => {
    updateBlock(block.id, { language })
    setShowLanguages(false)
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(block.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentLanguage = LANGUAGES.find((l) => l.value === block.language)?.label || block.language

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div className="overflow-hidden rounded-lg border-2 border-border bg-zinc-900 text-zinc-100">
        {/* Header with language selector */}
        <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-3 py-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowLanguages(!showLanguages)
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              {currentLanguage}
              <ChevronDown className="h-3 w-3" />
            </button>

            {showLanguages && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-44 overflow-auto rounded-lg border border-zinc-600 bg-zinc-800 p-1 shadow-xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLanguageChange(lang.value)
                    }}
                    className={cn(
                      'w-full rounded px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white',
                      block.language === lang.value && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              copied
                ? 'text-green-400'
                : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
            )}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Code content */}
        <textarea
          value={block.content}
          onChange={handleContentChange}
          placeholder="// Write your code here..."
          className={cn(
            'w-full resize-none bg-transparent p-4 font-mono text-sm text-zinc-100 outline-none',
            'min-h-[100px] placeholder:text-zinc-500'
          )}
          spellCheck={false}
          rows={Math.max(4, block.content.split('\n').length)}
        />
      </div>
    </div>
  )
}
