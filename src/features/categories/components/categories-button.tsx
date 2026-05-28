'use client'

import { useState } from 'react'

import { Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { CategoryManagement } from './category-management'

interface CategoriesButtonProps {
  variant?: 'secondary' | 'ghost'
  size?: 'sm' | 'default'
  label?: string
}

/**
 * Drop-in button that opens the full CategoryManagement UI in a modal.
 * Use anywhere the user might want to add/edit/reorder categories without
 * navigating away (Dashboard, Goals, Schedule, etc).
 */
export function CategoriesButton({
  variant = 'secondary',
  size = 'sm',
  label = 'Categories',
}: CategoriesButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Tag className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
            <DialogDescription>
              Edit, reorder, or add categories. Used across goals, schedule blocks, and tasks.
            </DialogDescription>
          </DialogHeader>
          <CategoryManagement />
        </DialogContent>
      </Dialog>
    </>
  )
}
