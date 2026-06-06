export const PENDING_LIBRARY_KEY = 'goalslot-pending-add-library'

export function parseAddLibraryFromUrl(): { libraryUrl: string; idToken: string | null } | null {
  if (typeof window === 'undefined') return null

  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  const searchParams = new URLSearchParams(window.location.search)
  const libraryUrl = hashParams.get('addLibrary') ?? searchParams.get('addLibrary')
  if (!libraryUrl) return null

  return {
    libraryUrl,
    idToken: hashParams.get('token') ?? searchParams.get('token'),
  }
}

/** Capture addLibrary before Next.js router.replace() strips the hash. */
export function stashPendingLibraryFromUrl(): void {
  const tokens = parseAddLibraryFromUrl()
  if (!tokens) return

  try {
    sessionStorage.setItem(PENDING_LIBRARY_KEY, JSON.stringify(tokens))
  } catch {
    // private mode / quota
  }
}

export function takePendingLibrary(): { libraryUrl: string; idToken: string | null } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_LIBRARY_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_LIBRARY_KEY)
    return JSON.parse(raw) as { libraryUrl: string; idToken: string | null }
  } catch {
    return null
  }
}

export function appendCurrentHash(path: string): string {
  if (typeof window === 'undefined') return path
  return path + window.location.hash
}

export function clearAddLibraryFromUrl(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  let changed = false

  if (url.searchParams.has('addLibrary')) {
    url.searchParams.delete('addLibrary')
    url.searchParams.delete('token')
    changed = true
  }

  const hashParams = new URLSearchParams(url.hash.slice(1))
  if (hashParams.has('addLibrary')) {
    hashParams.delete('addLibrary')
    hashParams.delete('token')
    url.hash = hashParams.toString() ? `#${hashParams.toString()}` : ''
    changed = true
  }

  if (changed) {
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
}
