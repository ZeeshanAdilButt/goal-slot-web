'use client'

import { useState } from 'react'

import { CategoryManagement } from '@/features/categories/components/category-management'
import { Plus, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'

interface GoalsHeaderProps {
  onCreateClick: () => void
}

export function GoalsHeader({ onCreateClick }: GoalsHeaderProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow="Goals"
        title="Goals"
        description="Track your objectives and targets"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCategoriesOpen(true)}>
              <Tag className="h-4 w-4" />
              Categories
            </Button>
            <Button onClick={onCreateClick} variant="brand">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>
        }
      />

      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
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
