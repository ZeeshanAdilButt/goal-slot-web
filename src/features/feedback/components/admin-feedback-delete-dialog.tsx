import { useDeleteFeedbackMutation } from '@/features/feedback/hooks/use-feedback-mutations'
import { Feedback as FeedbackType } from '@/features/feedback/utils/types'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AdminFeedbackDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: FeedbackType | null
}

export const AdminFeedbackDeleteDialog = ({ open, onOpenChange, feedback }: AdminFeedbackDeleteDialogProps) => {
  const deleteMutation = useDeleteFeedbackMutation()

  const handleDelete = () => {
    if (!feedback) return

    deleteMutation.mutate(feedback.id, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-brutal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">Delete Feedback</DialogTitle>
        </DialogHeader>
        <p className="text-gray-600">Are you sure you want to delete this feedback? This action cannot be undone.</p>
        {feedback && (
          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-sm font-medium">{feedback.user.name}</p>
            {feedback.text && <p className="mt-2 text-sm">{feedback.text}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
