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
 * Any absolute URL parsed against this resolves to a different origin, which is
 * exactly the signal we test for below. `.invalid` is reserved by RFC 2606 and
 * can never be a real host.
 */
const SENTINEL_ORIGIN = 'https://internal.invalid'

/**
 * True only for a path that stays on this origin.
 *
 * Resolving against a sentinel origin rather than pattern-matching the string
 * is deliberate: the checks that look obvious are the ones that miss. A
 * `startsWith('/')` test lets through `//evil.example.com`, which browsers read
 * as protocol-relative. Adding `&& !startsWith('//')` still lets through
 * `/\evil.example.com`, because the WHATWG URL parser normalises a backslash to
 * a forward slash for http(s) URLs, so the browser sees the same
 * protocol-relative URL the second check was written to stop. It also strips
 * tab, newline and carriage return anywhere in the input, so `/\tevil` style
 * inputs re-form after the check has already passed.
 *
 * Handing the string to the same parser the browser will use, and asking
 * whether the result is still us, cannot drift from the browser's behaviour
 * the way a growing list of string rules does.
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (typeof value !== 'string' || !value.startsWith('/')) return false

  let resolved: URL
  try {
    resolved = new URL(value, SENTINEL_ORIGIN)
  } catch {
    return false
  }

  return resolved.origin === SENTINEL_ORIGIN
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

/**
 * Reads and clears the stored destination. Returns null when there is none.
 *
 * Callers must call this on every callback attempt, including the ones that
 * bail out early, so a destination left over from an abandoned sign-in cannot
 * hijack the next one - most concretely, sending a later Google login to a CLI
 * approval page the user has already forgotten about.
 */
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
