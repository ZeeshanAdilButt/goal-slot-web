'use client'

import { useMemo, useState } from 'react'

import { AdminFeedbackDeleteDialog } from '@/features/feedback/components/admin-feedback-delete-dialog'
import { AdminFeedbackFilters } from '@/features/feedback/components/admin-feedback-filters'
import { AdminFeedbackHeader } from '@/features/feedback/components/admin-feedback-header'
import { AdminFeedbackList } from '@/features/feedback/components/admin-feedback-list'
import { useFeedbacksQuery } from '@/features/feedback/hooks/use-feedback-queries'
import { FeedbackFilterType, Feedback as FeedbackType } from '@/features/feedback/utils/types'

import { Loading } from '@/components/ui/loading'

export const AdminFeedbackPage = () => {
  const [filter, setFilter] = useState<FeedbackFilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Build query filters based on filter selection
  const queryFilters = useMemo(() => {
    if (filter === 'archived') {
      return { isArchived: true }
    } else if (filter === 'active') {
      return { isArchived: false }
    }
    return undefined
  }, [filter])

  const { data: feedbacks = [], isLoading } = useFeedbacksQuery(queryFilters)

  // Filter feedbacks by search term
  const filteredFeedbacks = useMemo(() => {
    if (!searchTerm) return feedbacks

    const search = searchTerm.toLowerCase()
    return feedbacks.filter(
      (feedback: FeedbackType) =>
        feedback.user.name.toLowerCase().includes(search) ||
        feedback.user.email.toLowerCase().includes(search) ||
        feedback.text?.toLowerCase().includes(search) ||
        '',
    )
  }, [feedbacks, searchTerm])

  const handleDelete = (feedback: FeedbackType) => {
    setSelectedFeedback(feedback)
    setShowDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setSelectedFeedback(null)
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <AdminFeedbackHeader />
      <AdminFeedbackFilters
        filter={filter}
        onFilterChange={setFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <AdminFeedbackList feedbacks={filteredFeedbacks} filter={filter} onDelete={handleDelete} />
      <AdminFeedbackDeleteDialog
        open={showDeleteDialog}
        onOpenChange={handleCloseDeleteDialog}
        feedback={selectedFeedback}
      />
    </div>
  )
}
