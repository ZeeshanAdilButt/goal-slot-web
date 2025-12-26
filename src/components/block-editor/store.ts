'use client'

import { create } from 'zustand'

import { Block, createBlock, BlockType, EditorState, EditorActions } from './types'

interface BlockEditorStore extends EditorState, EditorActions {}

export const useBlockEditorStore = create<BlockEditorStore>((set, get) => ({
  // State
  blocks: [],
  selectedBlockId: null,
  isSlashMenuOpen: false,
  slashMenuPosition: null,
  slashMenuFilter: '',

  // Actions
  setBlocks: (blocks) => set({ blocks }),

  addBlock: (block, afterId) => {
    const { blocks } = get()
    if (afterId) {
      const index = blocks.findIndex((b) => b.id === afterId)
      if (index !== -1) {
        const newBlocks = [...blocks]
        newBlocks.splice(index + 1, 0, block)
        set({ blocks: newBlocks, selectedBlockId: block.id })
        return
      }
    }
    set({ blocks: [...blocks, block], selectedBlockId: block.id })
  },

  updateBlock: (id, updates) => {
    const { blocks } = get()
    set({
      blocks: blocks.map((b) =>
        b.id === id ? ({ ...b, ...updates, updatedAt: new Date() } as Block) : b
      ),
    })
  },

  deleteBlock: (id) => {
    const { blocks, selectedBlockId } = get()
    const index = blocks.findIndex((b) => b.id === id)
    const newBlocks = blocks.filter((b) => b.id !== id)

    // If the deleted block was selected, select the previous one
    let newSelectedId = selectedBlockId === id ? null : selectedBlockId
    if (selectedBlockId === id && newBlocks.length > 0) {
      const newIndex = Math.max(0, index - 1)
      newSelectedId = newBlocks[newIndex]?.id || null
    }

    set({ blocks: newBlocks, selectedBlockId: newSelectedId })
  },

  moveBlock: (id, direction) => {
    const { blocks } = get()
    const index = blocks.findIndex((b) => b.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    const [removed] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, removed)
    set({ blocks: newBlocks })
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  openSlashMenu: (position) =>
    set({ isSlashMenuOpen: true, slashMenuPosition: position, slashMenuFilter: '' }),

  closeSlashMenu: () =>
    set({ isSlashMenuOpen: false, slashMenuPosition: null, slashMenuFilter: '' }),

  setSlashMenuFilter: (filter) => set({ slashMenuFilter: filter }),
}))

// Hook to create a new block and add it to the editor
export function useAddNewBlock() {
  const addBlock = useBlockEditorStore((state) => state.addBlock)
  const closeSlashMenu = useBlockEditorStore((state) => state.closeSlashMenu)
  const selectedBlockId = useBlockEditorStore((state) => state.selectedBlockId)

  return (type: BlockType) => {
    const newBlock = createBlock(type)
    addBlock(newBlock, selectedBlockId || undefined)
    closeSlashMenu()
    return newBlock
  }
}

// Hook for managing a standalone editor instance
export function useBlockEditor(initialBlocks: Block[] = []) {
  const store = useBlockEditorStore()

  // Initialize blocks if provided
  if (initialBlocks.length > 0 && store.blocks.length === 0) {
    store.setBlocks(initialBlocks)
  }

  return {
    blocks: store.blocks,
    selectedBlockId: store.selectedBlockId,
    isSlashMenuOpen: store.isSlashMenuOpen,
    slashMenuPosition: store.slashMenuPosition,
    slashMenuFilter: store.slashMenuFilter,
    setBlocks: store.setBlocks,
    addBlock: store.addBlock,
    updateBlock: store.updateBlock,
    deleteBlock: store.deleteBlock,
    moveBlock: store.moveBlock,
    selectBlock: store.selectBlock,
    openSlashMenu: store.openSlashMenu,
    closeSlashMenu: store.closeSlashMenu,
    setSlashMenuFilter: store.setSlashMenuFilter,
  }
}
