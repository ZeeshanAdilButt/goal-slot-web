// Notes System Types - OneNote-like hierarchical notes structure

import { Block } from '@/components/block-editor'

export interface Note {
  id: string
  title: string
  content: string // JSON string of blocks
  icon?: string
  color?: string
  parentId: string | null
  order: number
  isExpanded: boolean
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface NoteTreeItem extends Note {
  children: NoteTreeItem[]
  depth: number
}

export interface CreateNoteDto {
  title: string
  content?: string
  icon?: string
  color?: string
  parentId?: string | null
}

export interface UpdateNoteDto {
  title?: string
  content?: string
  icon?: string
  color?: string
  parentId?: string | null
  order?: number
  isExpanded?: boolean
  isFavorite?: boolean
}

// Note colors for customization
export const NOTE_COLORS = [
  { value: 'default', label: 'Default', bg: 'bg-card', border: 'border-border' },
  { value: 'red', label: 'Red', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-800' },
  { value: 'green', label: 'Green', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-50 dark:bg-pink-950', border: 'border-pink-200 dark:border-pink-800' },
]

// Note icons for customization
export const NOTE_ICONS = [
  '📝', '📋', '📌', '📎', '📁', '📂', '🗂️', '📑',
  '💡', '⭐', '🎯', '🚀', '🔥', '💎', '🏆', '🎨',
  '📚', '📖', '✏️', '🖊️', '📊', '📈', '💼', '🗃️',
  '🔔', '⚡', '🌟', '💫', '🎪', '🎭', '🎬', '🎮',
]

// Helper to build tree structure from flat notes array
export function buildNoteTree(notes: Note[]): NoteTreeItem[] {
  const noteMap = new Map<string, NoteTreeItem>()
  const roots: NoteTreeItem[] = []

  // First pass: create NoteTreeItem for each note
  notes.forEach((note) => {
    noteMap.set(note.id, { ...note, children: [], depth: 0 })
  })

  // Second pass: build tree structure
  notes.forEach((note) => {
    const treeItem = noteMap.get(note.id)!
    if (note.parentId && noteMap.has(note.parentId)) {
      const parent = noteMap.get(note.parentId)!
      treeItem.depth = parent.depth + 1
      parent.children.push(treeItem)
    } else {
      roots.push(treeItem)
    }
  })

  // Sort children by order
  const sortByOrder = (items: NoteTreeItem[]) => {
    items.sort((a, b) => a.order - b.order)
    items.forEach((item) => sortByOrder(item.children))
  }
  sortByOrder(roots)

  return roots
}

// Helper to get all descendant IDs of a note
export function getDescendantIds(note: NoteTreeItem): string[] {
  const ids: string[] = []
  const collectIds = (item: NoteTreeItem) => {
    ids.push(item.id)
    item.children.forEach(collectIds)
  }
  note.children.forEach(collectIds)
  return ids
}

// Helper to flatten tree for rendering
export function flattenNoteTree(
  tree: NoteTreeItem[],
  expandedIds: Set<string>,
  depth = 0
): (NoteTreeItem & { depth: number })[] {
  const result: (NoteTreeItem & { depth: number })[] = []

  tree.forEach((item) => {
    result.push({ ...item, depth })
    if (item.children.length > 0 && expandedIds.has(item.id)) {
      result.push(...flattenNoteTree(item.children, expandedIds, depth + 1))
    }
  })

  return result
}

// Generate a link to a note that can be inserted in the editor
export function getNoteLink(note: Note): string {
  return `/dashboard/notes/${note.id}`
}

// Parse note content to blocks
export function parseNoteContent(content: string): Block[] {
  try {
    return JSON.parse(content)
  } catch {
    return []
  }
}

// Stringify blocks to note content
export function stringifyNoteContent(blocks: Block[]): string {
  return JSON.stringify(blocks)
}
