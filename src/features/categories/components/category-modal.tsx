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
      <DialogContent className="modal-brutal">
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
              className="input-brutal w-full"
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
            <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-brutal-dark flex-1">
              {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
