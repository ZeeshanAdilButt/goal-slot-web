import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { authApi } from '@/lib/api'
import { clearOutbox } from '@/lib/offline/outbox'
import { queryClient } from '@/lib/query-client'
import { clearPersistedQueryCache } from '@/lib/query-persister'
import { useOfflineQueueStore } from '@/lib/use-offline-queue-store'
import { useTimerStore } from '@/lib/use-timer-store'

/**
 * Wipes every piece of per-user client state that outlives a page load, so one
 * account's data can't be read - or written - under another account's session.
 *
 * There are four such stores, and all four have to go together:
 *  - the in-memory React Query cache;
 *  - its dehydrated copy in IndexedDB, which `PersistQueryClientProvider`
 *    restores on the next mount and would otherwise put the old data straight
 *    back;
 *  - the offline outbox, whose entries carry no owner and would replay the
 *    previous account's queued writes against the new account's token;
 *  - the timer store, which pins a task/goal/schedule-block id from the
 *    previous account.
 *
 * Note this also covers the messaging JWT: it lives in the React Query cache
 * (`messagingQueries.token()`), stays fresh for four minutes, and is what
 * jiffy-messaging authenticates against. Left behind, the new account would
 * fetch the previous account's conversations *live* - not merely render them
 * from cache.
 */
function resetClientState() {
  try {
    queryClient.clear()
  } catch {
    // ignore
  }
  void clearPersistedQueryCache()
  void clearOutbox().then(() => {
    useOfflineQueueStore.getState().setPendingCount(0)
    useOfflineQueueStore.getState().setLastSyncError(null)
  })
  try {
    useTimerStore.getState().reset()
  } catch {
    // ignore
  }
}

/**
 * The catch-all guard: any time we learn who the session belongs to, compare it
 * against who it belonged to a moment ago and wipe the client if they differ.
 *
 * This is deliberately the mechanism rather than a `resetClientState()` call
 * bolted onto each sign-in path. `/auth/callback` (the Google OAuth landing
 * page) never goes through `login`/`ssoLogin` at all - it calls `setTokens()`
 * and `loadUser()` directly - which is exactly how it missed the reset the
 * other paths had. Any future sign-in path is covered here for free.
 *
 * A `previousUserId` of undefined is a cold start, not a switch: there is no
 * prior identity to leak from, and resetting there would throw away a warm
 * offline cache on every first load.
 */
function resetIfIdentityChanged(previousUserId: string | undefined, nextUserId: string | undefined): void {
  if (!previousUserId || previousUserId === nextUserId) return
  resetClientState()
}

function isAuthFailure(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 401 || status === 403
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  userType: 'INTERNAL' | 'EXTERNAL' | 'SSO'
  plan: 'FREE' | 'BASIC' | 'PRO'
  unlimitedAccess: boolean
  // Threshold the dashboard Focus Streak card measures the day against.
  // Optional on the client only because a browser can be holding a persisted
  // user object minted before the API shipped this field; useFocusStreak
  // falls back to DEFAULT_DAILY_FOCUS_GOAL_MINUTES when it is missing.
  dailyFocusGoalMinutes?: number
  subscriptionStatus?: string
  subscriptionEndDate?: string | null
  preferences?: {
    timezone?: string
    [key: string]: any
  }
  limits: {
    maxGoals: number
    maxSchedules: number
    maxTasksPerDay: number
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, otp: string) => Promise<void>
  ssoLogin: (token: string, email: string, name?: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => {
        resetIfIdentityChanged(get().user?.id, user?.id)
        set({ user, isAuthenticated: !!user })
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, refreshToken })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ email, password })
          resetClientState()
          get().setTokens(data.accessToken, data.refreshToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email, password, name, otp) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register({ email, password, name, otp })
          resetClientState()
          get().setTokens(data.accessToken, data.refreshToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      ssoLogin: async (token, email, name) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.ssoLogin({ token, email, name })
          resetClientState()
          get().setTokens(data.accessToken, data.refreshToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        resetClientState()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      loadUser: async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const { data } = await authApi.getProfile()
          // The OAuth callback lands here holding the *previous* user in the
          // rehydrated store while `data` is the newly signed-in one. This is
          // the point at which the switch becomes knowable, and it runs before
          // the dashboard mounts and reads the cache.
          resetIfIdentityChanged(get().user?.id, data?.id)
          set({ user: data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          if (isAuthFailure(error)) {
            get().logout()
            set({ isLoading: false })
            return
          }

          // Offline / network failures are not auth failures. Keep the token
          // and let the dashboard render from the persisted React Query cache.
          set({ isAuthenticated: true, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)

// Helper hook for checking permissions
export const useIsAdmin = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}

export const useHasProAccess = () => {
  const user = useAuthStore((state) => state.user)
  if (!user) return false
  return user.plan === 'BASIC' || user.plan === 'PRO' || user.unlimitedAccess || user.userType === 'INTERNAL'
}
