'use client'

import { X } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TimerSwitchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTask: string
  elapsedTime: string
  onSaveAndSwitch: () => void | Promise<void>
  onDiscardAndContinue: () => void
  isLoading?: boolean
}

export function TimerSwitchDialog({
  open,
  onOpenChange,
  currentTask,
  elapsedTime,
  onSaveAndSwitch,
  onDiscardAndContinue,
  isLoading = false,
}: TimerSwitchDialogProps) {
  const handleSaveAndSwitch = async () => {
    await onSaveAndSwitch()
    onOpenChange(false)
  }

  const handleDiscardAndContinue = () => {
    onDiscardAndContinue()
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Close the dialog immediately
      onOpenChange(false)
    }
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertDialogTitle className="text-2xl font-bold uppercase">Timer Already Running</AlertDialogTitle>
              <AlertDialogDescription className="mb-4 font-mono">
                You have a timer running for &quot;{currentTask}&quot; ({elapsedTime}). Save it before switching?
              </AlertDialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-sm border-2 border-secondary bg-white p-1 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-sm disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 text-secondary" />
            </button>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col gap-1 sm:flex-col sm:gap-2">
          <AlertDialogAction
            onClick={handleDiscardAndContinue}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                <span className="hidden sm:inline">Discard Current Timer and Start New</span>
                <span className="sm:hidden">Discard & Start New</span>
              </>
            )}
          </AlertDialogAction>
          <AlertDialogAction onClick={handleSaveAndSwitch} disabled={isLoading}>
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                <span className="hidden sm:inline">Save Current Timer and Start New</span>
                <span className="sm:hidden">Save & Start New</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}
