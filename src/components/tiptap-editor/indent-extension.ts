import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockIndent: {
      indentBlock: () => ReturnType
      outdentBlock: () => ReturnType
      clearIndent: () => ReturnType
    }
  }
}

export interface IndentOptions {
  types: string[]
  minLevel: number
  maxLevel: number
}

// Adds an `indent` attribute (clamped to [minLevel, maxLevel]) to paragraph
// and heading nodes so Tab / Shift-Tab can indent plain text the same way
// they sink / lift list items. Rendered via `data-indent` so the CSS layer
// can apply consistent padding-left without hardcoding pixel math here.
export const IndentExtension = Extension.create<IndentOptions>({
  name: 'blockIndent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 6,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-indent')
              const n = raw ? parseInt(raw, 10) : 0
              return Number.isFinite(n) && n > 0 ? n : 0
            },
            renderHTML: (attributes) => {
              const level = (attributes.indent as number) || 0
              if (!level) return {}
              return { 'data-indent': String(level) }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    // Walk up from a position to check whether any ancestor is a list
    // item. Source of truth for "is this block visually inside a bullet?"
    // Used to refuse writing data-indent onto a paragraph that sits inside
    // a <li>, since the bullet itself already expresses the visual indent
    // and an additional margin-left produces the "huge gap between marker
    // and text" bug. Defense in depth alongside the CSS guard and the
    // sanitizer's data-indent strip.
    const isInsideListItem = (state: any, pos: number): boolean => {
      const $pos = state.doc.resolve(pos)
      for (let d = $pos.depth; d >= 0; d--) {
        const name = $pos.node(d).type.name
        if (name === 'listItem' || name === 'taskItem') return true
      }
      return false
    }

    const adjust = (delta: number) => () => ({ state, tr, dispatch }: any) => {
      const { selection } = state
      const { from, to } = selection
      let touched = false

      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        if (!this.options.types.includes(node.type.name)) return true
        if (isInsideListItem(state, pos)) return true
        const current = (node.attrs.indent as number) || 0
        const next = Math.max(
          this.options.minLevel,
          Math.min(this.options.maxLevel, current + delta),
        )
        if (next === current) return true
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
        touched = true
        return true
      })

      if (touched && dispatch) dispatch(tr)
      return touched
    }

    const reset = () => () => ({ state, tr, dispatch }: any) => {
      const { selection } = state
      const { from, to } = selection
      let touched = false

      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        if (!this.options.types.includes(node.type.name)) return true
        if (!node.attrs.indent) return true
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: 0 })
        touched = true
        return true
      })

      if (touched && dispatch) dispatch(tr)
      return touched
    }

    return {
      indentBlock: adjust(1),
      outdentBlock: adjust(-1),
      clearIndent: reset(),
    }
  },
})
