export interface AdminUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  userType: 'INTERNAL' | 'EXTERNAL'
  plan: 'FREE' | 'BASIC' | 'PRO'
  unlimitedAccess: boolean
  subscriptionStatus?: string
  subscriptionEndDate?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  firstPaymentDate?: string
  lastPaymentDate?: string
  invoicePending?: boolean
  lastInvoiceId?: string
  isDisabled: boolean
  disabledAt?: string
  disabledReason?: string
  emailVerified: boolean
  emailVerifiedAt?: string
  adminAssignedPlan?: string
  adminAssignedPlanAt?: string
  adminAssignedPlanBy?: string
  adminAssignedPlanNote?: string
  createdAt: string
  updatedAt: string
}

export interface AdminUserStats {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  byPlan: {
    free: number
    basic: number
    pro: number
  }
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'USER' | 'ADMIN'
}

export type AdminModalType = 'create' | 'disable' | 'assignPlan' | 'bulkAssignPlan' | 'details' | null
