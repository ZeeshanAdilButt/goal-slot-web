import { FeedbackFilterType } from '@/features/feedback/utils/types'
import { Search } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AdminFeedbackFiltersProps {
  filter: FeedbackFilterType
  onFilterChange: (filter: FeedbackFilterType) => void
  searchTerm: string
  onSearchChange: (search: string) => void
}

export const AdminFeedbackFilters = ({
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}: AdminFeedbackFiltersProps) => {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by user name, email, or feedback text..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-brutal w-full pl-10"
        />
      </div>
      <Select value={filter} onValueChange={(value: FeedbackFilterType) => onFilterChange(value)}>
        <SelectTrigger className="input-brutal w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Feedback</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
