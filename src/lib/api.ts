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

        if (!isAuthRequest && !isLoginPage) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  ssoLogin: (data: { token: string; email: string; name?: string }) => api.post('/auth/sso', data),
  getProfile: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
}

// Goals API
export const goalsApi = {
  getAll: (params?: { status?: string; category?: string; categories?: string; labelIds?: string }) =>
    api.get('/goals', { params }),
  getOne: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
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
  getRecent: (limit?: number) => api.get('/time-entries/recent', { params: { limit } }),
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
}

// Sharing API
export const sharingApi = {
  invite: (email: string) => api.post('/sharing/invite', { email }),
  share: (data: { email: string; accessLevel?: 'VIEW' | 'EDIT' }) => api.post('/sharing/invite', { email: data.email }),
  accept: (token: string) => api.post('/sharing/accept', null, { params: { token } }),
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
  // Public access methods (no auth required)
  getPublicSharedData: (token: string) => api.get(`/public/share/view/${token}`),
  getPublicSharedTimeEntries: (token: string, startDate: string, endDate: string) =>
    api.get(`/public/share/view/${token}/time-entries`, { params: { startDate, endDate } }),
  getPublicSharedGoals: (token: string) => api.get(`/public/share/view/${token}/goals`),
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

