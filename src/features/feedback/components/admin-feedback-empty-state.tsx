import { MessageSquare } from 'lucide-react'

interface AdminFeedbackEmptyStateProps {
  filter: string
}

export const AdminFeedbackEmptyState = ({ filter }: AdminFeedbackEmptyStateProps) => {
  return (
    <div className="card-brutal p-8 text-center">
      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-4 font-bold">No feedback found</p>
      <p className="text-sm text-gray-600">
        {filter === 'archived' ? 'No archived feedback' : 'No feedback submissions yet'}
      </p>
    </div>
  )
}
