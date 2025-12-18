import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { authApi } from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  userType: 'INTERNAL' | 'EXTERNAL' | 'SSO'
  plan: 'FREE' | 'PRO' | 'PREMIUM'
  unlimitedAccess: boolean
  subscriptionStatus?: string
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
  register: (email: string, password: string, name: string) => Promise<void>
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

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, refreshToken })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ email, password })
          get().setTokens(data.accessToken, data.refreshToken)
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register({ email, password, name })
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
          set({ user: data, isAuthenticated: true, isLoading: false })
        } catch {
          get().logout()
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
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

export const useIsSuperAdmin = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'SUPER_ADMIN'
}

export const useHasProAccess = () => {
  const user = useAuthStore((state) => state.user)
  if (!user) return false
  return user.plan === 'PRO' || user.plan === 'PREMIUM' || user.unlimitedAccess || user.userType === 'INTERNAL'
}
