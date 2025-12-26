'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { common, createLowlight } from 'lowlight'
import { useCallback, useEffect, useState } from 'react'

import './tiptap-editor.css'
import { ResizableImage } from './resizable-image'

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Copy,
  Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { SlashCommands } from './slash-commands'

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content?: string
  onChange?: (html: string, json: any) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = "Type '/' for commands...",
  className,
  editable = true,
}: TiptapEditorProps) {
  const [isCopied, setIsCopied] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        dropcursor: {
          color: '#FFCC00',
          width: 4,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          return placeholder
        },
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      ResizableImage,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      SlashCommands,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle image drops
        if (!moved && event.dataTransfer?.files.length) {
          const files = Array.from(event.dataTransfer.files)
          const images = files.filter(file => file.type.startsWith('image/'))
          
          if (images.length > 0) {
            event.preventDefault()
            images.forEach(image => {
              const reader = new FileReader()
              reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === 'string') {
                  editor?.chain().focus().insertContent({ type: 'image', attrs: { src: result } }).run()
                }
              }
              reader.readAsDataURL(image)
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        // Handle image pastes
        const items = Array.from(event.clipboardData?.items || [])
        const images = items.filter(item => item.type.startsWith('image/'))
        
        if (images.length > 0) {
          event.preventDefault()
          images.forEach(item => {
            const file = item.getAsFile()
            if (file) {
              const reader = new FileReader()
              reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === 'string') {
                  editor?.chain().focus().insertContent({ type: 'image', attrs: { src: result } }).run()
                }
              }
              reader.readAsDataURL(file)
            }
          })
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getJSON())
    },
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A in code block - select only code block content
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (editor.isActive('codeBlock')) {
          e.preventDefault()
          e.stopPropagation()
          
          // Find the code block node position
          const { state } = editor
          const { $from } = state.selection
          
          // Walk up to find the codeBlock node
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth)
            if (node.type.name === 'codeBlock') {
              const start = $from.before(depth) + 1
              const end = start + node.content.size
              editor.chain().focus().setTextSelection({ from: start, to: end }).run()
              return
            }
          }
        }
      }

      // Tab handling for lists
      if (e.key === 'Tab' && !e.shiftKey) {
        if (editor.isActive('taskItem') || editor.isActive('listItem')) {
          e.preventDefault()
          editor.chain().focus().sinkListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem').run()
        }
      }
      
      // Shift+Tab for outdenting
      if (e.key === 'Tab' && e.shiftKey) {
        if (editor.isActive('taskItem') || editor.isActive('listItem')) {
          e.preventDefault()
          editor.chain().focus().liftListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem').run()
        }
      }
    }

    // Use capture phase to intercept before ProseMirror
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [editor])

  const copyAsMarkdown = useCallback(() => {
    if (!editor) return
    // Simple HTML to text conversion
    const text = editor.getText()
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [editor])

  const copyAsHTML = useCallback(() => {
    if (!editor) return
    navigator.clipboard.writeText(editor.getHTML())
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [editor])

  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            editor?.chain().focus().insertContent({ type: 'image', attrs: { src: result } }).run()
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={cn('tiptap-editor', className)}>
      {/* Toolbar */}
      {editable && (
        <div className="tiptap-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="toolbar-btn"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="toolbar-btn"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn('toolbar-btn', editor.isActive('heading', { level: 1 }) && 'is-active')}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn('toolbar-btn', editor.isActive('heading', { level: 2 }) && 'is-active')}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn('toolbar-btn', editor.isActive('heading', { level: 3 }) && 'is-active')}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn('toolbar-btn', editor.isActive('bold') && 'is-active')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn('toolbar-btn', editor.isActive('italic') && 'is-active')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn('toolbar-btn', editor.isActive('underline') && 'is-active')}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn('toolbar-btn', editor.isActive('strike') && 'is-active')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn('toolbar-btn', editor.isActive('code') && 'is-active')}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn('toolbar-btn', editor.isActive('highlight') && 'is-active')}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn('toolbar-btn', editor.isActive('bulletList') && 'is-active')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn('toolbar-btn', editor.isActive('orderedList') && 'is-active')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn('toolbar-btn', editor.isActive('taskList') && 'is-active')}
              title="Task List"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn('toolbar-btn', editor.isActive('blockquote') && 'is-active')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn('toolbar-btn', editor.isActive('codeBlock') && 'is-active')}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="toolbar-btn"
              title="Divider"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button onClick={addImage} className="toolbar-btn" title="Add Image">
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              onClick={setLink}
              className={cn('toolbar-btn', editor.isActive('link') && 'is-active')}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button onClick={addTable} className="toolbar-btn" title="Add Table">
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn('toolbar-btn', editor.isActive({ textAlign: 'left' }) && 'is-active')}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn('toolbar-btn', editor.isActive({ textAlign: 'center' }) && 'is-active')}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn('toolbar-btn', editor.isActive({ textAlign: 'right' }) && 'is-active')}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <div className="ml-auto toolbar-group">
            <button
              onClick={copyAsHTML}
              className={cn('toolbar-btn', isCopied && 'is-copied')}
              title="Copy as HTML"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Bubble Menu - appears when text is selected */}
      {editor && editable && (
        <BubbleMenu
          editor={editor}
          className="bubble-menu"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('bubble-btn', editor.isActive('bold') && 'is-active')}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('bubble-btn', editor.isActive('italic') && 'is-active')}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('bubble-btn', editor.isActive('underline') && 'is-active')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('bubble-btn', editor.isActive('strike') && 'is-active')}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('bubble-btn', editor.isActive('code') && 'is-active')}
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn('bubble-btn', editor.isActive('highlight') && 'is-active')}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            onClick={setLink}
            className={cn('bubble-btn', editor.isActive('link') && 'is-active')}
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="flex-1 flex flex-col min-h-0" />
    </div>
  )
}

export default TiptapEditor
