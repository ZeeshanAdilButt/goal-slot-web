// Block Editor Types - Notion-like block-based editing system

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bulletList'
  | 'numberedList'
  | 'toggleList'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'table'
  | 'kanban'
  | 'image'
  | 'link'

export interface BaseBlock {
  id: string
  type: BlockType
  createdAt: Date
  updatedAt: Date
}

export interface TextBlock extends BaseBlock {
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote'
  content: string
}

export interface TodoBlock extends BaseBlock {
  type: 'todo'
  content: string
  checked: boolean
}

export interface ListBlock extends BaseBlock {
  type: 'bulletList' | 'numberedList'
  items: ListItem[]
}

export interface ListItem {
  id: string
  content: string
  children?: ListItem[]
}

export interface ToggleBlock extends BaseBlock {
  type: 'toggleList'
  title: string
  content: string
  isOpen: boolean
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  content: string
  icon: string
  color: CalloutColor
}

export type CalloutColor = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange'

export interface CodeBlock extends BaseBlock {
  type: 'code'
  content: string
  language: string
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
}

export interface TableBlock extends BaseBlock {
  type: 'table'
  rows: TableRow[]
  headers: string[]
}

export interface TableRow {
  id: string
  cells: string[]
}

export interface KanbanBlock extends BaseBlock {
  type: 'kanban'
  columns: KanbanColumn[]
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
}

export interface KanbanCard {
  id: string
  content: string
  color?: string
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
}

export interface LinkBlock extends BaseBlock {
  type: 'link'
  url: string
  title: string
  description?: string
}

export type Block =
  | TextBlock
  | TodoBlock
  | ListBlock
  | ToggleBlock
  | CalloutBlock
  | CodeBlock
  | DividerBlock
  | TableBlock
  | KanbanBlock
  | ImageBlock
  | LinkBlock

// Slash Command Menu Types
export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
  keywords: string[]
  type: BlockType
  shortcut?: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text.',
    icon: 'Type',
    keywords: ['text', 'paragraph', 'plain'],
    type: 'paragraph',
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Big section heading.',
    icon: 'Heading1',
    keywords: ['h1', 'heading', 'title', 'big'],
    type: 'heading1',
    shortcut: '#',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading.',
    icon: 'Heading2',
    keywords: ['h2', 'heading', 'subtitle', 'medium'],
    type: 'heading2',
    shortcut: '##',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading.',
    icon: 'Heading3',
    keywords: ['h3', 'heading', 'small'],
    type: 'heading3',
    shortcut: '###',
  },
  {
    id: 'todo',
    label: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: 'CheckSquare',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    type: 'todo',
    shortcut: '[]',
  },
  {
    id: 'bulletList',
    label: 'Bulleted List',
    description: 'Create a simple bulleted list.',
    icon: 'List',
    keywords: ['bullet', 'list', 'unordered'],
    type: 'bulletList',
    shortcut: '-',
  },
  {
    id: 'numberedList',
    label: 'Numbered List',
    description: 'Create a list with numbering.',
    icon: 'ListOrdered',
    keywords: ['number', 'list', 'ordered'],
    type: 'numberedList',
    shortcut: '1.',
  },
  {
    id: 'toggleList',
    label: 'Toggle List',
    description: 'Toggles can hide and show content inside.',
    icon: 'ChevronRight',
    keywords: ['toggle', 'collapse', 'expand', 'accordion'],
    type: 'toggleList',
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote.',
    icon: 'Quote',
    keywords: ['quote', 'blockquote', 'citation'],
    type: 'quote',
    shortcut: '>',
  },
  {
    id: 'callout',
    label: 'Callout',
    description: 'Make writing stand out.',
    icon: 'AlertCircle',
    keywords: ['callout', 'alert', 'notice', 'info'],
    type: 'callout',
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Capture a code snippet.',
    icon: 'Code',
    keywords: ['code', 'snippet', 'programming'],
    type: 'code',
    shortcut: '```',
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks.',
    icon: 'Minus',
    keywords: ['divider', 'separator', 'line', 'hr'],
    type: 'divider',
    shortcut: '---',
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Add a table to organize data.',
    icon: 'Table',
    keywords: ['table', 'grid', 'spreadsheet'],
    type: 'table',
  },
  {
    id: 'kanban',
    label: 'Kanban Board',
    description: 'Organize tasks in columns.',
    icon: 'Columns',
    keywords: ['kanban', 'board', 'columns', 'trello'],
    type: 'kanban',
  },
]

// Editor State
export interface EditorState {
  blocks: Block[]
  selectedBlockId: string | null
  isSlashMenuOpen: boolean
  slashMenuPosition: { x: number; y: number } | null
  slashMenuFilter: string
}

// Editor Actions
export interface EditorActions {
  setBlocks: (blocks: Block[]) => void
  addBlock: (block: Block, afterId?: string) => void
  updateBlock: (id: string, updates: Partial<Block>) => void
  deleteBlock: (id: string) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
  selectBlock: (id: string | null) => void
  openSlashMenu: (position: { x: number; y: number }) => void
  closeSlashMenu: () => void
  setSlashMenuFilter: (filter: string) => void
}

// Helper to create new blocks
export function createBlock(type: BlockType): Block {
  const baseBlock = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  switch (type) {
    case 'paragraph':
    case 'heading1':
    case 'heading2':
    case 'heading3':
    case 'quote':
      return { ...baseBlock, type, content: '' } as TextBlock
    case 'todo':
      return { ...baseBlock, type, content: '', checked: false } as TodoBlock
    case 'bulletList':
    case 'numberedList':
      return {
        ...baseBlock,
        type,
        items: [{ id: crypto.randomUUID(), content: '' }],
      } as ListBlock
    case 'toggleList':
      return { ...baseBlock, type, title: '', content: '', isOpen: true } as ToggleBlock
    case 'callout':
      return { ...baseBlock, type, content: '', icon: '💡', color: 'default' } as CalloutBlock
    case 'code':
      return { ...baseBlock, type, content: '', language: 'javascript' } as CodeBlock
    case 'divider':
      return { ...baseBlock, type } as DividerBlock
    case 'table':
      return {
        ...baseBlock,
        type,
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          { id: crypto.randomUUID(), cells: ['', '', ''] },
          { id: crypto.randomUUID(), cells: ['', '', ''] },
        ],
      } as TableBlock
    case 'kanban':
      return {
        ...baseBlock,
        type,
        columns: [
          { id: crypto.randomUUID(), title: 'To Do', color: '#f87171', cards: [] },
          { id: crypto.randomUUID(), title: 'In Progress', color: '#fbbf24', cards: [] },
          { id: crypto.randomUUID(), title: 'Done', color: '#4ade80', cards: [] },
        ],
      } as KanbanBlock
    case 'image':
      return { ...baseBlock, type, url: '', alt: '' } as ImageBlock
    case 'link':
      return { ...baseBlock, type, url: '', title: '' } as LinkBlock
    default:
      return { ...baseBlock, type: 'paragraph', content: '' } as TextBlock
  }
}

// Serialize blocks to JSON string for storage
export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks)
}

// Deserialize JSON string to blocks
export function deserializeBlocks(json: string): Block[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Convert blocks to Markdown for copying
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return (block as TextBlock).content || ''
      case 'heading1':
        return `# ${(block as TextBlock).content || ''}`
      case 'heading2':
        return `## ${(block as TextBlock).content || ''}`
      case 'heading3':
        return `### ${(block as TextBlock).content || ''}`
      case 'quote':
        return `> ${(block as TextBlock).content || ''}`
      case 'todo': {
        const todoBlock = block as TodoBlock
        return `- [${todoBlock.checked ? 'x' : ' '}] ${todoBlock.content || ''}`
      }
      case 'bulletList': {
        const listBlock = block as ListBlock
        return listBlock.items.map((item) => `- ${item.content}`).join('\n')
      }
      case 'numberedList': {
        const listBlock = block as ListBlock
        return listBlock.items.map((item, i) => `${i + 1}. ${item.content}`).join('\n')
      }
      case 'toggleList': {
        const toggleBlock = block as ToggleBlock
        return `<details>\n<summary>${toggleBlock.title}</summary>\n\n${toggleBlock.content}\n</details>`
      }
      case 'callout': {
        const calloutBlock = block as CalloutBlock
        return `> ${calloutBlock.icon} ${calloutBlock.content}`
      }
      case 'code': {
        const codeBlock = block as CodeBlock
        return `\`\`\`${codeBlock.language}\n${codeBlock.content}\n\`\`\``
      }
      case 'divider':
        return '---'
      case 'table': {
        const tableBlock = block as TableBlock
        const headers = `| ${tableBlock.headers.join(' | ')} |`
        const separator = `| ${tableBlock.headers.map(() => '---').join(' | ')} |`
        const rows = tableBlock.rows.map((row) => `| ${row.cells.join(' | ')} |`).join('\n')
        return `${headers}\n${separator}\n${rows}`
      }
      case 'kanban': {
        const kanbanBlock = block as KanbanBlock
        return kanbanBlock.columns
          .map((col) => {
            const cards = col.cards.map((card) => `  - ${card.content}`).join('\n')
            return `### ${col.title}\n${cards || '  (no items)'}`
          })
          .join('\n\n')
      }
      default:
        return ''
    }
  }).filter(Boolean).join('\n\n')
}

// Convert blocks to plain text for copying
export function blocksToPlainText(blocks: Block[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'quote':
        return (block as TextBlock).content || ''
      case 'todo': {
        const todoBlock = block as TodoBlock
        return `${todoBlock.checked ? '✓' : '○'} ${todoBlock.content || ''}`
      }
      case 'bulletList':
      case 'numberedList': {
        const listBlock = block as ListBlock
        return listBlock.items.map((item) => `• ${item.content}`).join('\n')
      }
      case 'toggleList': {
        const toggleBlock = block as ToggleBlock
        return `${toggleBlock.title}\n  ${toggleBlock.content}`
      }
      case 'callout': {
        const calloutBlock = block as CalloutBlock
        return `${calloutBlock.icon} ${calloutBlock.content}`
      }
      case 'code': {
        const codeBlock = block as CodeBlock
        return codeBlock.content
      }
      case 'divider':
        return '────────────'
      case 'table': {
        const tableBlock = block as TableBlock
        const maxWidths = tableBlock.headers.map((h, i) =>
          Math.max(h.length, ...tableBlock.rows.map((r) => r.cells[i]?.length || 0))
        )
        const headers = tableBlock.headers.map((h, i) => h.padEnd(maxWidths[i])).join(' │ ')
        const separator = maxWidths.map((w) => '─'.repeat(w)).join('─┼─')
        const rows = tableBlock.rows
          .map((row) => row.cells.map((c, i) => (c || '').padEnd(maxWidths[i])).join(' │ '))
          .join('\n')
        return `${headers}\n${separator}\n${rows}`
      }
      case 'kanban': {
        const kanbanBlock = block as KanbanBlock
        return kanbanBlock.columns
          .map((col) => {
            const cards = col.cards.map((card) => `  • ${card.content}`).join('\n')
            return `[${col.title}]\n${cards || '  (empty)'}`
          })
          .join('\n\n')
      }
      default:
        return ''
    }
  }).filter(Boolean).join('\n\n')
}
