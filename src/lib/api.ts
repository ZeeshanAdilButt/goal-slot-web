import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Don't redirect if we're already on the login page or making auth requests
        const isAuthRequest = error.config?.url?.includes('/auth/')
        const isLoginPage = window.location.pathname === '/login'
        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
        const redirectUrl = `/login?redirect=${encodeURIComponent(returnUrl || '/dashboard')}`

        if (!isAuthRequest && !isLoginPage) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = redirectUrl
        }
      }
    }
    return Promise.reject(error)
  },
)

// Feedback API
export const feedbackApi = {
  create: (data: { emoji?: number; text?: string }) => api.post('/feedback', data),
  getAll: (params?: { isArchived?: boolean; userId?: string }) => api.get('/feedback', { params }),
  getOne: (id: string) => api.get(`/feedback/${id}`),
  archive: (id: string, data: { isArchived: boolean }) => api.put(`/feedback/${id}/archive`, data),
  delete: (id: string) => api.delete(`/feedback/${id}`),
  reply: (id: string, data: { message: string }) => api.post(`/feedback/${id}/responses`, data),
  getThread: (id: string) => api.get(`/feedback/${id}/thread`),
}

// Auth API
export const authApi = {
  checkEmailExists: (email: string) => api.get('/auth/check-email', { params: { email } }),
  sendOTP: (data: { email: string; purpose: 'SIGNUP' | 'FORGOT_PASSWORD' }) => api.post('/auth/send-otp', data),
  verifyOTP: (data: { email: string; otp: string; purpose: 'SIGNUP' | 'FORGOT_PASSWORD' }) =>
    api.post('/auth/verify-otp', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => api.post('/auth/reset-password', data),
  register: (data: { email: string; password: string; name: string; otp: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  ssoLogin: (data: { token: string; email: string; name?: string }) => api.post('/auth/sso', data),
  getProfile: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  sendChangePasswordOTP: (data: { currentPassword: string }) => api.post('/auth/send-change-password-otp', data),
  changePassword: (data: { currentPassword: string; otp: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
}

// Goals API
export const goalsApi = {
  getAll: (params?: { status?: string; category?: string; categories?: string; labelIds?: string }) =>
    api.get('/goals', { params }),
  getOne: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  reorder: (ids: string[]) => api.put('/goals/reorder', { ids }),
  getStats: () => api.get('/goals/stats'),
}

// Time Entries API
export const timeEntriesApi = {
  getByWeek: (weekStart: string) => api.get('/time-entries/week', { params: { weekStart } }),
  getByRange: (startDate: string, endDate: string) =>
    api.get('/time-entries/range', { params: { startDate, endDate } }),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get('/time-entries/range', { params: { startDate, endDate } }),
  getToday: () => api.get('/time-entries/today'),
  getWeeklyTotal: () => api.get('/time-entries/weekly-total'),
  getRecent: (params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) =>
    api.get('/time-entries/recent', { params }),
  create: (data: any) => api.post('/time-entries', data),
  update: (id: string, data: any) => api.put(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
}

// Schedule API
export const scheduleApi = {
  getAll: () => api.get('/schedule'),
  getWeekly: () => api.get('/schedule/week'),
  getByDay: (dayOfWeek: number) => api.get(`/schedule/day/${dayOfWeek}`),
  create: (data: any) => api.post('/schedule', data),
  update: (id: string, data: any) => api.put(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
}

// Reports API
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getWeekly: (weekStart?: string) => api.get('/reports/weekly', { params: { weekStart } }),
  getWeeklySummary: (weekOffset?: number) => api.get('/reports/weekly-summary', { params: { weekOffset } }),
  getGoalsProgress: () => api.get('/reports/goals-progress'),
  getGoalProgress: () => api.get('/reports/goal-progress'),
  getMonthly: (year: number, month: number) => api.get('/reports/monthly', { params: { year, month } }),
  
  // New detailed and summary report endpoints
  getDetailed: (params: ReportFilters) => api.get('/reports/detailed', { params }),
  getSummary: (params: ReportFilters) => api.get('/reports/summary', { params }),
  getDayByTask: (params: ReportFilters) => api.get('/reports/day-by-task', { params }),
  getDayTotal: (params: ReportFilters) => api.get('/reports/day-total', { params }),
  getScheduleReport: (params: ReportFilters) => api.get('/reports/schedule', { params }),
  getFilterableGoals: () => api.get('/reports/filterable-goals'),
  getFilterableTasks: (goalId?: string) => api.get('/reports/filterable-tasks', { params: { goalId } }),
  exportReport: (data: ExportReportParams) => api.post('/reports/export', data, {
    responseType: data.format === 'csv' ? 'blob' : 'json',
  }),
}

// Report filter types
export interface ReportFilters {
  startDate: string
  endDate: string
  viewType?: 'detailed' | 'summary' | 'day_by_task' | 'day_total' | 'schedule'
  groupBy?: 'goal' | 'task' | 'date' | 'category'
  goalIds?: string
  taskIds?: string
  category?: string
  sortBy?: 'date_asc' | 'date_desc' | 'duration_asc' | 'duration_desc' | 'goal' | 'task'
  includeBillable?: boolean
  hourlyRate?: number
}

export interface ExportReportParams extends ReportFilters {
  format: 'csv' | 'pdf' | 'json'
  title?: string
  includeClientInfo?: boolean
  clientName?: string
  projectName?: string
  notes?: string
}

// Tasks API
export const tasksApi = {
  create: (data: any) => api.post('/tasks', data),
  list: (params?: any) => api.get('/tasks', { params }),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  complete: (id: string, data: { actualMinutes: number; notes?: string; date?: string }) =>
    api.post(`/tasks/${id}/complete`, data),
  restore: (id: string) => api.post(`/tasks/${id}/restore`),
  reorder: (ids: string[]) => api.put('/tasks/reorder', { ids }),
}

// Sharing API
export const sharingApi = {
  invite: (email: string) => api.post('/sharing/invite', { email }),
  share: (data: { email: string; accessLevel?: 'VIEW' | 'EDIT' }) =>
    api.post('/sharing/invite', { email: data.email, accessLevel: data.accessLevel || 'VIEW' }),
  accept: (token: string) => api.post('/sharing/accept', { token }, { params: { token } }),
  getAll: () => api.get('/sharing'),
  getMyShares: () => api.get('/sharing/my-shares'),
  getPendingInvites: () => api.get('/sharing/pending-invites'),
  getSharedData: (ownerId: string) => api.get(`/sharing/user/${ownerId}`),
  revoke: (shareId: string) => api.delete(`/sharing/revoke/${shareId}`),
  remove: (shareId: string) => api.delete(`/sharing/remove/${shareId}`),
  acceptInvite: (inviteId: string) => api.post(`/sharing/accept/${inviteId}`),
  declineInvite: (inviteId: string) => api.post(`/sharing/decline/${inviteId}`),
  // New methods for shared reports
  getSharedWithMe: () => api.get('/sharing/shared-with-me'),
  getSharedUserTimeEntries: (ownerId: string, startDate: string, endDate: string) =>
    api.get(`/sharing/user/${ownerId}/time-entries`, { params: { startDate, endDate } }),
  getSharedUserGoals: (ownerId: string) => api.get(`/sharing/user/${ownerId}/goals`),
  // Public link management
  createPublicLink: (data?: { accessLevel?: 'VIEW' | 'EDIT'; expiresInDays?: number }) =>
    api.post('/sharing/public-link', data || {}),
  getMyPublicLinks: () => api.get('/sharing/my-public-links'),
  deletePublicLink: (shareId: string) => api.delete(`/sharing/public-link/${shareId}`),
  // Public access methods (no auth required)
  getPublicSharedData: (token: string) => api.get(`/public/share/view/${token}`),
  getPublicSharedTimeEntries: (token: string, startDate: string, endDate: string) =>
    api.get(`/public/share/view/${token}/time-entries`, { params: { startDate, endDate } }),
  getPublicSharedGoals: (token: string) => api.get(`/public/share/view/${token}/goals`),
}

export const notificationsApi = {
  list: (params?: { cursor?: string; limit?: number }) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
}

export const releaseNotesApi = {
  latest: () => api.get('/release-notes/latest'),
  markSeen: (id: string) => api.patch(`/release-notes/${id}/seen`),
  create: (data: { version: string; title: string; content: string; publishedAt?: string }) => api.post('/release-notes', data),
}

// Stripe API
export const stripeApi = {
  createCheckout: () => api.post('/stripe/create-checkout-session'),
  createCheckoutSession: (plan: string) => api.post('/stripe/create-checkout-session', { plan }),
  createPortal: () => api.post('/stripe/create-portal-session'),
  createPortalSession: () => api.post('/stripe/create-portal-session'),
  getStatus: () => api.get('/stripe/subscription-status'),
  mockActivate: () => api.post('/stripe/mock/activate'),
  mockCancel: () => api.post('/stripe/mock/cancel'),
}

// Users API (Admin)
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { name?: string; avatar?: string }) => api.put('/users/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/password', { currentPassword, newPassword }),
  deleteAccount: () => api.delete('/users/account'),
  // Admin: List users with optional search
  listUsers: (page?: number, limit?: number, search?: string) =>
    api.get('/users/admin/list', { params: { page, limit, search } }),
  // Admin: Get user statistics
  getStats: () => api.get('/users/admin/stats'),
  // Admin: Get single user details
  getUserDetails: (userId: string) => api.get(`/users/admin/user/${userId}`),
  // Admin: Create internal user
  createInternal: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/users/admin/internal', data),
  // Admin: Grant free Pro access
  grantAccess: (userId: string) => api.post(`/users/admin/grant-access/${userId}`),
  // Admin: Revoke free access
  revokeAccess: (userId: string) => api.post(`/users/admin/revoke-access/${userId}`),
  // Admin: Toggle user disabled status
  toggleStatus: (userId: string, data: { isDisabled: boolean; reason?: string }) =>
    api.post(`/users/admin/toggle-status/${userId}`, data),
  // Admin: Assign plan to user
  assignPlan: (userId: string, data: { plan: 'FREE' | 'BASIC' | 'PRO'; note?: string }) =>
    api.post(`/users/admin/assign-plan/${userId}`, data),
  // Admin: Bulk Assign plan to users
  bulkAssignPlan: (data: { userIds: string[]; plan: 'FREE' | 'BASIC' | 'PRO'; note?: string }) =>
    api.post('/users/admin/bulk-assign-plan', data),
  // Admin: Set email verification status
  setEmailVerified: (userId: string, data: { emailVerified: boolean }) =>
    api.post(`/users/admin/set-email-verified/${userId}`, data),
  // Super Admin: Promote user to admin
  promote: (userId: string) => api.post(`/users/admin/promote/${userId}`),
  // Super Admin: Demote admin to user
  demote: (userId: string) => api.post(`/users/admin/demote/${userId}`),
}

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string; color: string; order?: number }) => api.post('/categories', data),
  update: (id: string, data: { name?: string; color?: string; order?: number; isDefault?: boolean }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

// Labels API
export const labelsApi = {
  getAll: () => api.get('/labels'),
  getOne: (id: string) => api.get(`/labels/${id}`),
  create: (data: { name: string; color?: string; order?: number }) => api.post('/labels', data),
  update: (id: string, data: { name?: string; color?: string; order?: number }) => api.put(`/labels/${id}`, data),
  delete: (id: string) => api.delete(`/labels/${id}`),
  assignToGoal: (goalId: string, labelIds: string[]) => api.post(`/labels/goals/${goalId}/assign`, { labelIds }),
  getForGoal: (goalId: string) => api.get(`/labels/goals/${goalId}`),
}

// Notes API
export const notesApi = {
  getAll: () => api.get('/notes'),
  getOne: (id: string) => api.get(`/notes/${id}`),
  create: (data: { title: string; content?: string; icon?: string; color?: string; parentId?: string | null }) =>
    api.post('/notes', data),
  update: (
    id: string,
    data: {
      title?: string
      content?: string
      icon?: string
      color?: string
      parentId?: string | null
      order?: number
      isExpanded?: boolean
      isFavorite?: boolean
    },
  ) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  reorder: (data: { noteId: string; parentId: string | null; order: number }[]) => api.put('/notes/reorder', data),
}
