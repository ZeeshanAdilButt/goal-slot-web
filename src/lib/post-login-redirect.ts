/**
 * Carries a post-login destination across an OAuth round trip.
 *
 * Password login reads ?redirect straight off the URL, but Google sends the
 * browser to /auth/callback with only the tokens in the query string, so the
 * parameter cannot survive in the URL. sessionStorage does: same origin, same
 * tab, and consumed the moment the callback runs.
 */
const POST_LOGIN_REDIRECT_KEY = 'goalslot:postLoginRedirect'

/**
 * Only same-origin relative paths are ever followed. `//evil.example.com` is a
 * protocol-relative URL that a browser treats as another origin, so the second
 * character has to be rejected too - without that check this would be an open
 * redirect that launders through our own login page.
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\/(?!\/)/.test(value)
}

export function rememberPostLoginRedirect(path: string | null | undefined): void {
  if (typeof window === 'undefined' || !isSafeInternalPath(path)) return
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path)
  } catch {
    // Private mode or storage disabled. Losing the redirect is a small
    // annoyance; failing the sign-in over it would not be.
  }
}

/** Reads and clears the stored destination. Returns null when there is none. */
export function consumePostLoginRedirect(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    return isSafeInternalPath(stored) ? stored : null
  } catch {
    return null
  }
}
