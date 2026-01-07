import { AdminFeedbackEmptyState } from '@/features/feedback/components/admin-feedback-empty-state'
import { FeedbackItem } from '@/features/feedback/components/admin-feedback-item'
import { Feedback as FeedbackType } from '@/features/feedback/utils/types'

interface AdminFeedbackListProps {
  feedbacks: FeedbackType[]
  filter: string
  onDelete: (feedback: FeedbackType) => void
}

export const AdminFeedbackList = ({ feedbacks, filter, onDelete }: AdminFeedbackListProps) => {
  if (feedbacks.length === 0) {
    return <AdminFeedbackEmptyState filter={filter} />
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <FeedbackItem key={feedback.id} feedback={feedback} onDelete={onDelete} />
      ))}
    </div>
  )
}
