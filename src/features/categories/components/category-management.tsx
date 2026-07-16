'use client'

import { useState } from 'react'

import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/features/categories'
import { Category, CreateCategoryForm } from '@/features/categories/utils/types'
import { Edit2, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { CategoryModal } from './category-modal'

export function CategoryManagement() {
  const { data: categories = [], isLoading } = useCategoriesQuery()
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const handleCreate = (data: CreateCategoryForm | Partial<Category>) => {
    createMutation.mutate(data as CreateCategoryForm, {
      onSuccess: () => {
        setIsCreateModalOpen(false)
      },
    })
  }

  const handleUpdate = (id: string, data: CreateCategoryForm | Partial<Category>) => {
    updateMutation.mutate(
      { id, data: data as Partial<Category> },
      {
        onSuccess: () => {
          setEditingCategory(null)
        },
      },
    )
  }

  const handleDelete = (category: Category) => {
    deleteMutation.mutate(category.id, {
      onSuccess: () => {
        setDeletingCategory(null)
      },
    })
  }

  if (isLoading) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-2 p-4 shadow-sm sm:p-6">Loading categories...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase">Categories</h2>
          <p className="font-mono text-sm text-gray-600">Manage your custom categories</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-2 p-4 shadow-sm sm:p-6">
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-gray-600">No categories yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-black"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <div className="font-bold uppercase">{category.name}</div>
                    <div className="font-mono text-xs text-gray-600">{category.value}</div>
                  </div>
                  {category.isDefault && (
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-bold uppercase">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingCategory(category)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 px-4 py-2 text-sm font-semibold text-red-600 text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CategoryModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreate} />
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <CategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          onSubmit={(data) => handleUpdate(editingCategory.id, data)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <ConfirmDialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
          onConfirm={() => handleDelete(deletingCategory)}
          title="Delete Category"
          description={`Are you sure you want to delete "${deletingCategory.name}"? If this category is in use, it will be removed from all items.`}
          confirmButtonText="Delete"
          variant="destructive"
        />
      )}
    </div>
  )
}
