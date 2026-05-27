'use client'

import { useState } from 'react'

import { Category, CreateCategoryForm } from '@/features/categories/utils/types'

import { cn, COLOR_OPTIONS } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Category
  onSubmit: (data: CreateCategoryForm | Partial<Category>) => void
}

export function CategoryModal({ isOpen, onClose, category, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '')
  const [color, setColor] = useState(category?.color || COLOR_OPTIONS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      onSubmit({ name, color })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] w-full"
              placeholder="e.g., Learning"
              required
            />
            <p className="mt-1 text-xs text-gray-600">The value will be automatically generated from the name</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Color</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-10 w-10 rounded-full border-2 border-black transition-transform hover:scale-110',
                    color === c ? 'ring-2 ring-black ring-offset-2' : '',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border border-black" style={{ backgroundColor: color }} />
              <span className="font-mono text-xs">{color}</span>
            </div>
          </div>

          <DialogFooter className="flex-row gap-4 pt-4">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-50 disabled:opacity-50 flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50 flex-1">
              {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
