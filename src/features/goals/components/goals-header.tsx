'use client'

import { CategoriesButton } from '@/features/categories/components/categories-button'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

interface GoalsHeaderProps {
  onCreateClick: () => void
}

export function GoalsHeader({ onCreateClick }: GoalsHeaderProps) {
  return (
    <PageHeader
      eyebrow="Goals"
      title="Goals"
      description="Track your objectives and targets"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <CategoriesButton />
          <Button onClick={onCreateClick} variant="brand" size="sm">
            <Plus className="h-3.5 w-3.5" />
            New Goal
          </Button>
        </div>
      }
    />
  )
}
