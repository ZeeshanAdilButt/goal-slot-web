import { Plus } from 'lucide-react'

interface GoalsHeaderProps {
  onCreateClick: () => void
}

export function GoalsHeader({ onCreateClick }: GoalsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">Goals</h1>
        <p className="font-mono uppercase text-gray-600">Track your objectives and targets</p>
      </div>

      <button onClick={onCreateClick} className="btn-brutal flex w-full items-center justify-center gap-2 sm:w-auto">
        <Plus className="h-5 w-5" />
        New Goal
      </button>
    </div>
  )
}
