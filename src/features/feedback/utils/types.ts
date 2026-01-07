export type FeedbackEmoji = 0 | 1 | 2 | 3

export interface Feedback {
  id: string
  userId: string
  emoji: number | null
  text: string | null
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface CreateFeedbackForm {
  emoji?: number
  text?: string
}

export interface FeedbackFilters {
  isArchived?: boolean
  userId?: string
}

export interface ArchiveFeedbackForm {
  isArchived: boolean
}

export type FeedbackFilterType = 'all' | 'archived' | 'active'

export const emojiLabels = ['Love it', "It's okay", 'Not great', 'Hate it'] as const

export const getEmojiIcon = (emoji: number | null): string | null => {
  if (emoji === null) return null
  const icons = ['😍', '😐', '😕', '😠']
  return icons[emoji] || null
}
