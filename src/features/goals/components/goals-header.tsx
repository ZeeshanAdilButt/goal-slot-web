import { Plus } from 'lucide-react'

interface GoalsHeaderProps {
  onCreateClick: () => void
}

export function GoalsHeader({ onCreateClick }: GoalsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">Goals</h1>
        <p className="font-mono uppercase text-gray-600">Track your objectives and targets</p>
      </div>

      <button onClick={onCreateClick} className="btn-brutal flex items-center gap-2">
        <Plus className="h-5 w-5" />
        New Goal
      </button>
    </div>
  )
}
