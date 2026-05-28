'use client'

import { useEffect } from 'react'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

/**
 * Global theme store. Persists to localStorage so the choice survives
 * reloads. The Settings page exposes the toggle directly; the journal
 * page flips it on while mounted so visiting the journal = automatic
 * dark mode (and leaving restores the previously-set theme).
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'dw-theme',
    },
  ),
)

/**
 * Mount once at the app root. Keeps the `<html>` element's `dark`
 * class in sync with the persisted theme so the CSS rules in
 * `globals.css` apply. Also sets `color-scheme` so native widgets
 * (scrollbars, form controls) match the chrome.
 */
export function useApplyTheme() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [theme])
}
