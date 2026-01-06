export type AccessLevel = 'VIEW' | 'EDIT'

export type ShareStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED'

export type TabType = 'my' | 'shared-with-me'

export interface SharedUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface DataShare {
  id: string
  email: string
  accessLevel: AccessLevel
  status: ShareStatus
  createdAt: string
  expiresAt?: string
  sharedWith?: SharedUser
}

export interface PendingInvite {
  id: string
  owner: SharedUser
  ownerEmail?: string
  ownerName?: string
  accessLevel: AccessLevel
  createdAt: string
}

export interface SharedWithMeUser {
  id: string
  ownerId: string
  owner: SharedUser
  createdAt: string
}

export interface CreateShareForm {
  email: string
  accessLevel: AccessLevel
}

export interface ShareInviteResult {
  inviteLink: string | null
  emailSent: boolean
}

export interface SharedGoal {
  id: string
  title: string
  color: string
  category: string
  targetHours: number
  loggedHours: number
  status: string
}

export interface SharedTimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  goal?: {
    id: string
    title: string
    color: string
    category?: string
  }
}

export interface WeekRange {
  startDate: string
  endDate: string
  label: string
}

export interface SharedReportsStats {
  totalMinutes: number
  totalFormatted: string
  daysActive: number
  avgPerDay: number
  avgFormatted: string
  entriesCount: number
  dailyData: Array<{
    date: string
    minutes: number
    label: string
  }>
  goalData: Array<{
    title: string
    color: string
    minutes: number
  }>
}
