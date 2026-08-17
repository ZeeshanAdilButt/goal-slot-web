export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  userType: 'INTERNAL' | 'EXTERNAL'
  plan: 'FREE' | 'BASIC' | 'PRO'
  unlimitedAccess: boolean
  // Subscription fields
  subscriptionStatus?: string
  subscriptionEndDate?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  // Billing tracking
  firstPaymentDate?: string
  lastPaymentDate?: string
  invoicePending?: boolean
  lastInvoiceId?: string
  // Account status
  isDisabled: boolean
  disabledAt?: string
  disabledReason?: string
  emailVerified: boolean
  emailVerifiedAt?: string
  // Admin assigned plan
  adminAssignedPlan?: string
  adminAssignedPlanAt?: string
  adminAssignedPlanBy?: string
  adminAssignedPlanNote?: string
  createdAt: string
  updatedAt: string
  /**
   * True once the Expo app's push-registration flow completed for this
   * user - which requires them to have granted notification permission.
   * A lower bound on real mobile usage, not an exact figure: someone who
   * installed the app and declined that prompt still reads false here.
   */
  usesMobileApp: boolean
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  /** See User.usesMobileApp - same lower-bound caveat applies here. */
  mobileAppUsers: number
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

export type PlanValue = 'FREE' | 'BASIC' | 'PRO'

export type ModalType = 'create' | 'disable' | 'assignPlan' | 'bulkAssignPlan' | 'details' | null
