import TurndownService from 'turndown'

import { toISOString } from './utils'

function createTurndown() {
  // Keep output predictable and broadly compatible with common Markdown renderers.
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  })

  // Tiptap task lists are stored as custom data-* attributes, so we map them to GFM checkboxes.
  td.addRule('taskListItem', {
    filter: (node) => node.nodeName === 'LI' && (node as HTMLElement).getAttribute('data-type') === 'taskItem',
    replacement: (content, node) => {
      const checked = (node as HTMLElement).getAttribute('data-checked') === 'true'
      const body = content.replace(/^\n+|\n+$/g, '').replace(/\n/g, '\n  ')
      return `- [${checked ? 'x' : ' '}] ${body}\n`
    },
  })

  td.addRule('taskList', {
    filter: (node) => node.nodeName === 'UL' && (node as HTMLElement).getAttribute('data-type') === 'taskList',
    replacement: (content) => `\n${content.replace(/^\n+|\n+$/g, '')}\n\n`,
  })

  // Normalize all supported strike tags to Markdown's ~~text~~ form.
  td.addRule('strikethrough', {
    filter: ['s', 'del', 'strike'] as TurndownService.Filter,
    replacement: (content) => `~~${content}~~`,
  })

  return td
}

export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  const td = createTurndown()
  return td.turndown(html).trim()
}

function slugifyFilename(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface NoteFrontmatterInput {
  title: string
  createdAt: Date | string
  updatedAt: Date | string
}

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

export function buildNoteMarkdown(note: NoteFrontmatterInput, html: string): string {
  const created = toISOString(note.createdAt)
  const updated = toISOString(note.updatedAt)

  const title = note.title?.trim() || 'Untitled'
  const frontmatter = `---\ntitle: "${escapeYamlString(title)}"\ncreated: ${created}\nupdated: ${updated}\n---\n\n`
  const body = htmlToMarkdown(html)
  return body ? `${frontmatter}${body}\n` : frontmatter
}

export function downloadNoteAsMarkdown(note: NoteFrontmatterInput, html: string) {
  const markdown = buildNoteMarkdown(note, html)
  const slug = slugifyFilename(note.title || '')
  const filename = `${slug || 'untitled-note'}.md`
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
