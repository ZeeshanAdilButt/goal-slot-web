import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token refresh queue management
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

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

// Handle auth errors with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        return Promise.reject(error)
      }

      // Don't attempt refresh for specific auth endpoints or if already on login page
      const requestUrl = originalRequest?.url || ''
      const isRefreshEndpoint = requestUrl.includes('/auth/refresh')
      const isLoginEndpoint = requestUrl.includes('/auth/login')
      const isRegisterEndpoint = requestUrl.includes('/auth/register')
      const isSSOEndpoint = requestUrl.includes('/auth/sso')
      const isLoginPage = window.location.pathname === '/login'

      // Skip refresh for login/register/refresh endpoints or if already on login page
      if (isRefreshEndpoint || isLoginEndpoint || isRegisterEndpoint || isSSOEndpoint || isLoginPage) {
        return Promise.reject(error)
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token, logout user
        processQueue(error, null)
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        
        // Update auth store if available
        try {
          const { useAuthStore } = await import('@/lib/store')
          useAuthStore.getState().logout()
        } catch {
          // Store might not be available, that's okay
        }

        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
        const redirectUrl = `/login?redirect=${encodeURIComponent(returnUrl || '/dashboard')}`
        window.location.href = redirectUrl
        return Promise.reject(error)
      }

      try {
        // Attempt to refresh token (use axios directly to avoid interceptor)
        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const { accessToken, refreshToken: newRefreshToken } = response.data

        // Update tokens in localStorage
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update auth store if available
        try {
          const { useAuthStore } = await import('@/lib/store')
          useAuthStore.getState().setTokens(accessToken, newRefreshToken)
        } catch {
          // Store might not be available, that's okay
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        // Process queued requests
        processQueue(null, accessToken)
        isRefreshing = false

        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null)
        isRefreshing = false

        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        // Update auth store if available
        try {
          const { useAuthStore } = await import('@/lib/store')
          useAuthStore.getState().logout()
        } catch {
          // Store might not be available, that's okay
        }

        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
        const redirectUrl = `/login?redirect=${encodeURIComponent(returnUrl || '/dashboard')}`
        window.location.href = redirectUrl
        return Promise.reject(refreshError)
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
  refresh: (data: { refreshToken: string }) => api.post('/auth/refresh', data),
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
  showScheduleContext?: boolean
  includeTaskNotes?: boolean
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
  unseen: () => api.get('/release-notes/unseen'),
  markSeen: (id: string) => api.patch(`/release-notes/${id}/seen`),
  create: (data: { version: string; title: string; content: string; publishedAt?: string }) => api.post('/release-notes', data),
  update: (id: string, data: { version?: string; title?: string; content?: string; publishedAt?: string; resetSeen?: boolean }) => api.patch(`/release-notes/${id}`, data),
  list: () => api.get('/release-notes'),
  delete: (id: string) => api.delete(`/release-notes/${id}`),
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

// ---------------------------------------------------------------------------
// Coach API (BYOK + Habits + Check-ins + Reflections + Journal + Narrative + Chat)
// ---------------------------------------------------------------------------

export type CoachProviderEnum = 'OPENAI' | 'ANTHROPIC'
export type CoachByokStatus = 'unset' | 'active'

export interface CoachByokStateDto {
  status: CoachByokStatus
  provider: CoachProviderEnum | null
  maskedKey: string | null
  tokensUsed: number | null
  tokensLimit: number | null
  selectedModel?: string | null
  allowedModels?: string[]
  effectiveModel?: string | null
}

export interface CoachByokUsageDto {
  tokensUsed: number
  tokensLimit: number
  windowStart: string
}

export type ReligiousContextEnum =
  | 'NONE'
  | 'ISLAM'
  | 'CHRISTIANITY'
  | 'HINDUISM'
  | 'BUDDHISM'
  | 'JUDAISM'
  | 'SECULAR'
  | 'OTHER'

export interface CoachHabitsProfileDto {
  id?: string
  userId?: string
  why?: string
  phoneBlockerInstalled?: boolean
  distractingSubsCancelled?: boolean
  websiteBlockerUrls?: string
  sleepTargetHours?: number
  bedtime?: string
  wakeTime?: string
  workEnvironment?: string
  additionalContext?: string
  religiousContext?: ReligiousContextEnum
  spiritualNotes?: string
  createdAt?: string
  updatedAt?: string
}

// Coach Insights
export type CoachInsightKindEnum =
  | 'OBSERVATION'
  | 'SUGGESTION'
  | 'EXPERIMENT'
  | 'MEDIA_PROMPT'

export type CoachInsightStatusEnum =
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'DOING'
  | 'DONE'
  | 'DISMISSED'
  | 'SAVED'

export type CoachInsightMediaSlot =
  | 'BREAKFAST'
  | 'LUNCH'
  | 'EVENING'
  | 'BEDTIME'
  | 'ANY'

export type CoachInsightMediaTopic =
  | 'MINDSET'
  | 'CRAFT'
  | 'SPIRITUAL'
  | 'HABITS'
  | 'STRESS'
  | 'SLEEP'
  | 'DOPAMINE'

export type CoachInsightStatusFilter =
  | 'ACTIVE'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'DOING'
  | 'DONE'
  | 'DISMISSED'
  | 'SAVED'
  | 'ALL'

export interface CoachInsightDto {
  id: string
  scopeKey: string
  kind: CoachInsightKindEnum
  title: string
  body: string
  evidence: string
  suggestedAction: string | null
  mediaSlot: CoachInsightMediaSlot | null
  mediaTopic: CoachInsightMediaTopic | null
  status: CoachInsightStatusEnum
  acceptedAt: string | null
  startedDoingAt: string | null
  completedAt: string | null
  dismissedAt: string | null
  savedAt: string | null
  userNote: string | null
  createdAt: string
  updatedAt: string
}

export interface CoachDailyCheckin {
  id?: string
  date: string
  mood: number
  energy: number
  focus: number
  blocked?: string | null
  worked?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CoachGoalReflection {
  id?: string
  goalId: string
  weekKey: string
  feel: number
  worked?: string | null
  blocked?: string | null
  nextWeekFocus?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CoachJournalEntryDto {
  id: string
  date: string
  mood: number | null
  energy: number | null
  content: string
  createdAt?: string
  updatedAt: string
}

export interface CoachMessageDto {
  id: string
  scopeKey: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM_NARRATIVE'
  content: string
  promptTokens?: number | null
  completionTokens?: number | null
  model?: string | null
  createdAt: string
}

export interface CoachStreamChunk {
  delta: string
  done: boolean
  usage?: { promptTokens: number; completionTokens: number }
  error?: string
}

export type CoachProposalActionType =
  | 'RENAME_GOAL'
  | 'UPDATE_GOAL'
  | 'CREATE_GOAL'
  | 'DELETE_GOAL'
  | 'CREATE_SCHEDULE_BLOCK'
  | 'UPDATE_SCHEDULE_BLOCK'
  | 'DELETE_SCHEDULE_BLOCK'
  | 'CREATE_TIME_ENTRY'
  | 'UPDATE_TIME_ENTRY'
  | 'DELETE_TIME_ENTRY'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_PRACTICE'

export interface CoachProposalAction {
  type: CoachProposalActionType
  id?: string
  payload?: Record<string, unknown>
}

export interface CoachProposalResult {
  index: number
  type: CoachProposalActionType
  ok: boolean
  resultId?: string
  error?: string
}

export interface CoachProposalBlock {
  summary?: string
  actions: CoachProposalAction[]
}

const API_BASE_URL = `${API_URL}/api`

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

/**
 * Stream NestJS @Sse() responses framed as `data: {...}\n\n`.
 * Handles partial frames straddling chunk boundaries by holding an
 * accumulating buffer and only consuming up to the last `\n\n`.
 */
async function* parseCoachSseStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<CoachStreamChunk, void, void> {
  if (!response.body) {
    throw new Error('Response has no body to stream')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel()
        return
      }
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Parse complete SSE frames separated by a blank line (\n\n).
      // Tolerate \r\n line endings.
      const normalized = buffer.replace(/\r\n/g, '\n')
      buffer = ''
      const frames = normalized.split('\n\n')
      // Last element may be a partial frame — push it back into the buffer.
      const tail = frames.pop() ?? ''
      buffer = tail
      for (const frame of frames) {
        const trimmed = frame.trim()
        if (!trimmed) continue
        // A frame may contain multiple lines; concatenate `data:` payloads.
        const dataLines: string[] = []
        for (const line of trimmed.split('\n')) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart())
          }
        }
        if (dataLines.length === 0) continue
        const payload = dataLines.join('\n')
        try {
          const parsed = JSON.parse(payload)
          // NestJS @Sse() wraps the payload in { data: ... }; tolerate either shape.
          const inner = parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed
          yield inner as CoachStreamChunk
        } catch {
          // Ignore malformed frames rather than killing the stream.
        }
      }
    }
    // Flush any leftover trailing data after stream close (rare).
    const final = buffer.trim()
    if (final) {
      const lines = final.split('\n')
      const dataLines: string[] = []
      for (const line of lines) {
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
      }
      if (dataLines.length) {
        try {
          const parsed = JSON.parse(dataLines.join('\n'))
          const inner = parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed
          yield inner as CoachStreamChunk
        } catch {
          /* swallow */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* noop */
    }
  }
}

async function postCoachStream(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<AsyncGenerator<CoachStreamChunk, void, void>> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
    } catch {
      /* ignore */
    }
    const err: Error & { status?: number } = new Error(message)
    err.status = res.status
    throw err
  }

  return parseCoachSseStream(res, signal)
}

export const coachApi = {
  // BYOK
  getByokKey: () => api.get<CoachByokStateDto>('/coach/byok-key'),
  saveByokKey: (data: { provider: CoachProviderEnum; apiKey: string }) =>
    api.post<CoachByokStateDto>('/coach/byok-key', data),
  deleteByokKey: () => api.delete<{ success: boolean }>('/coach/byok-key'),
  getByokUsage: () => api.get<CoachByokUsageDto>('/coach/byok-key/usage'),
  updateByokBudget: (tokensLimit: number) =>
    api.patch<CoachByokStateDto>('/coach/byok-key/budget', { tokensLimit }),
  updateByokModel: (model: string) =>
    api.patch<CoachByokStateDto>('/coach/byok-key/model', { model }),

  // Habits profile
  getHabitsProfile: () => api.get<CoachHabitsProfileDto>('/coach/habits-profile'),
  updateHabitsProfile: (data: Partial<CoachHabitsProfileDto>) =>
    api.put<CoachHabitsProfileDto>('/coach/habits-profile', data),

  // Daily check-ins
  listCheckins: (params?: { from?: string; to?: string }) =>
    api.get<CoachDailyCheckin[]>('/coach/checkins', { params }),
  getTodayCheckin: () => api.get<CoachDailyCheckin | null>('/coach/checkins/today'),
  upsertCheckin: (data: {
    date: string
    mood: number
    energy: number
    focus: number
    blocked?: string
    worked?: string
  }) => api.post<CoachDailyCheckin>('/coach/checkins', data),

  // Goal reflections
  getGoalReflection: (goalId: string, weekKey?: string) =>
    api.get<CoachGoalReflection | null>(`/coach/goals/${goalId}/reflections`, {
      params: weekKey ? { weekKey } : undefined,
    }),
  getGoalReflectionHistory: (goalId: string) =>
    api.get<CoachGoalReflection[]>(`/coach/goals/${goalId}/reflections/history`),
  upsertGoalReflection: (
    goalId: string,
    data: {
      weekKey: string
      feel: number
      worked?: string
      blocked?: string
      nextWeekFocus?: string
    },
  ) => api.post<CoachGoalReflection>(`/coach/goals/${goalId}/reflections`, data),

  // Journal
  listJournalEntries: (params?: { from?: string; to?: string }) =>
    api.get<CoachJournalEntryDto[]>('/coach/journal/entries', { params }),
  getJournalEntry: (date: string) => api.get<CoachJournalEntryDto>(`/coach/journal/entries/${date}`),
  upsertJournalEntry: (data: { date: string; mood?: number | null; energy?: number | null; content?: string }) =>
    api.post<CoachJournalEntryDto>('/coach/journal/entries', data),
  updateJournalContent: (date: string, content: string) =>
    api.put<CoachJournalEntryDto>(`/coach/journal/entries/${date}/content`, { content }),
  updateJournalMood: (date: string, mood: number | null, energy: number | null) =>
    api.put<CoachJournalEntryDto>(`/coach/journal/entries/${date}/mood`, { mood, energy }),
  deleteJournalEntry: (date: string) =>
    api.delete<{ success: boolean }>(`/coach/journal/entries/${date}`),

  // Narrative (GET = cached, POST = SSE stream)
  getNarrative: (scopeKey: string) => api.get<CoachMessageDto>(`/coach/narrative/${scopeKey}`),
  streamNarrative: (scopeKey: string, opts?: { force?: boolean; signal?: AbortSignal }) =>
    postCoachStream(
      `/coach/narrative/${scopeKey}${opts?.force ? '?force=true' : ''}`,
      undefined,
      opts?.signal,
    ),

  // Chat
  // Backend returns { messages: CoachMessageDto[] } — normalize to a plain
  // array at the boundary so consumers (e.g. ChatSection) can always treat
  // res.data as an array.
  getChatHistory: async (scopeKey: string) => {
    const res = await api.get<{ messages?: CoachMessageDto[] } | CoachMessageDto[]>(
      `/coach/chat/${scopeKey}`,
    )
    const raw = res.data as { messages?: CoachMessageDto[] } | CoachMessageDto[] | null | undefined
    const messages = Array.isArray(raw) ? raw : raw?.messages ?? []
    return { ...res, data: messages }
  },
  clearChatHistory: (scopeKey: string) =>
    api.delete<{ success: true }>(`/coach/chat/${scopeKey}`),
  truncateChatFrom: (scopeKey: string, messageId: string) =>
    api.delete<{ deleted: number }>(`/coach/chat/${scopeKey}/messages/from/${messageId}`),
  saveChatMessageAsInsight: (scopeKey: string, messageId: string, title?: string) =>
    api.post<CoachInsightDto>(
      `/coach/chat/${scopeKey}/messages/${messageId}/save`,
      title ? { title } : {},
    ),
  streamChat: (scopeKey: string, content: string, opts?: { signal?: AbortSignal }) =>
    postCoachStream(`/coach/chat/${scopeKey}`, { content }, opts?.signal),

  // Coach Proposals — apply Coach-emitted structured action batches
  applyProposals: (
    actions: CoachProposalAction[],
    sourceMessageId?: string,
  ) =>
    api.post<{ results: CoachProposalResult[] }>('/coach/proposals/apply', {
      actions,
      ...(sourceMessageId ? { sourceMessageId } : {}),
    }),

  // Coach Insights
  listInsights: (status?: CoachInsightStatusFilter) =>
    api.get<CoachInsightDto[]>('/coach/insights', { params: status ? { status } : undefined }),
  getInsight: (id: string) => api.get<CoachInsightDto>(`/coach/insights/${id}`),
  updateInsightStatus: (id: string, status: CoachInsightStatusEnum, note?: string) =>
    api.post<CoachInsightDto>(`/coach/insights/${id}/status`, { status, note }),
  deleteInsight: (id: string) => api.delete<{ success: true }>(`/coach/insights/${id}`),
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
