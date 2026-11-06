import type { ProjectRoleValue } from '@/lib/api'

export type ProjectRole = ProjectRoleValue

/** One row of GET /projects (projects I belong to, not archived). */
export interface ProjectSummary {
  id: string
  name: string
  color: string
  role: ProjectRole
  memberCount: number
  openTaskCount: number
}

/** GET /projects/:id/members. email is only sent to ADMINs. */
export interface ProjectMember {
  userId: string
  name: string
  email?: string | null
  avatar?: string | null
  role: ProjectRole
  joinedAt: string
}

/** GET /projects/:id/invites. email null is the shareable link invite. */
export interface ProjectInvite {
  id: string
  email: string | null
  role: ProjectRole
  token?: string
  expiresAt: string
  acceptedAt?: string | null
  revokedAt?: string | null
  createdAt: string
}

/** GET /projects/invites/:token */
export interface ProjectInvitePreview {
  projectName: string
  color: string
  inviterName: string
  role: ProjectRole
  expired: boolean
  alreadyMember: boolean
}

export interface TaskProjectRef {
  id: string
  name: string
  color: string
}

export interface TaskAssigneeRef {
  id: string
  name: string
  avatar?: string | null
}

export const ROLE_LABELS: Record<ProjectRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  GUEST: 'Guest',
}

export const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  ADMIN: 'Manages members and settings of this project.',
  MEMBER: 'Creates and edits tasks, can be assigned, logs time.',
  GUEST: 'Views tasks, cannot edit. Good for mentors.',
}

export const PROJECT_COLORS = [
  '#2563EB',
  '#B45309',
  '#059669',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#0891B2',
  '#52525B',
] as const

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0]
