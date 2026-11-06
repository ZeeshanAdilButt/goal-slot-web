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
  projectId: string
  projectName: string
  color: string
  inviterName: string
  role: ProjectRole
  /** True when expired, revoked, or an email invite that was already used. */
  expired: boolean
  revoked: boolean
  alreadyMember: boolean
  /** Always true for link invites. */
  emailMatches: boolean
  /** Masked invited address (hi***@example.com); null for link invites. */
  email: string | null
}

/** POST /projects/invites/:token/accept (idempotent). */
export interface ProjectInviteAcceptResult {
  projectId: string
  role: ProjectRole
  alreadyMember: boolean
}

/** POST /projects/:id/invites */
export interface SendInvitesResult {
  invited: Array<{ id: string; email: string; role: ProjectRole; expiresAt: string; emailSent: boolean }>
  skipped: Array<{ email: string; reason: 'already_member' | 'pending_refreshed' }>
}

/** POST /projects/:id/invite-link */
export interface ProjectInviteLink {
  id: string
  token: string
  role: ProjectRole
  expiresAt: string
  /** Relative path to the accept page, e.g. /projects/invite?token=... */
  inviteLink: string
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
