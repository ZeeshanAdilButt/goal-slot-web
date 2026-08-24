import { Crown, ShieldCheck, Users } from 'lucide-react'

/** Small role glyph shown next to the role badge text in the users table. */
export function getRoleIcon(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return <Crown className="h-4 w-4 text-yellow-500" />
    case 'ADMIN':
      return <ShieldCheck className="h-4 w-4 text-purple-500" />
    default:
      return <Users className="h-4 w-4 text-gray-500" />
  }
}

export function getRoleBadge(role: string) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-yellow-200 text-yellow-800 border-yellow-400',
    ADMIN: 'bg-purple-200 text-purple-800 border-purple-400',
    USER: 'bg-gray-200 text-gray-800 border-gray-400',
  }
  return colors[role] || colors.USER
}

/**
 * Plans are stored server-side as FREE/BASIC/PRO but marketed as
 * Free/Pro/Max - getPlanDisplay does that translation for anything
 * user-facing.
 */
export function getPlanDisplay(plan: string) {
  switch (plan) {
    case 'BASIC':
      return 'PRO'
    case 'PRO':
      return 'MAX'
    default:
      return plan
  }
}

export function getPlanBadge(plan: string, unlimitedAccess: boolean, adminAssigned?: string) {
  if (unlimitedAccess && adminAssigned) {
    return 'border-emerald-400 bg-emerald-200 text-emerald-800'
  }
  const displayPlan = getPlanDisplay(plan)
  switch (displayPlan) {
    case 'MAX':
      return 'border-black bg-primary text-black'
    case 'PRO':
      return 'border-blue-400 bg-blue-200 text-blue-800'
    default:
      return 'border-gray-400 bg-gray-200 text-gray-800'
  }
}
