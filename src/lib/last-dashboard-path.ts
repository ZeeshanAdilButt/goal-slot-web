/**
 * Remembers the last dashboard page the user was on, so /app can drop them
 * straight back there instead of always on the dashboard home.
 *
 * localStorage, not sessionStorage: the point is that closing the tab or the
 * installed app and coming back tomorrow still lands on the same page.
 */
const LAST_DASHBOARD_PATH_KEY = 'goalslot:lastDashboardPath'

const MAX_LENGTH = 400

/**
 * Only real dashboard pages are worth coming back to. Anything else (the
 * landing page, /login, an external-looking string someone planted in
 * storage) falls back to the dashboard home.
 */
export function isRememberablePath(value: string | null | undefined): value is string {
  if (typeof value !== 'string' || value.length > MAX_LENGTH) return false
  if (value !== '/dashboard' && !/^\/dashboard[/?#]/.test(value)) return false
  // Resolve against a throwaway origin: a path that stays on it cannot be an
  // open redirect, whatever a backslash or control character does to it.
  try {
    return new URL(value, 'https://internal.invalid').origin === 'https://internal.invalid'
  } catch {
    return false
  }
}

export function rememberLastDashboardPath(path: string | null | undefined): void {
  if (typeof window === 'undefined' || !isRememberablePath(path)) return
  try {
    localStorage.setItem(LAST_DASHBOARD_PATH_KEY, path)
  } catch {
    // Storage disabled: coming back to the dashboard home is fine.
  }
}

export function readLastDashboardPath(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(LAST_DASHBOARD_PATH_KEY)
    return isRememberablePath(stored) ? stored : null
  } catch {
    return null
  }
}

export function clearLastDashboardPath(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LAST_DASHBOARD_PATH_KEY)
  } catch {
    // ignore
  }
}
