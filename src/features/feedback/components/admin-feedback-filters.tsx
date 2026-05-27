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
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] w-full pl-10"
        />
      </div>
      <Select value={filter} onValueChange={(value: FeedbackFilterType) => onFilterChange(value)}>
        <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] w-[180px]">
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
