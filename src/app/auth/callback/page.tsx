'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'

function AuthCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const setTokens = useAuthStore((s) => s.setTokens)
  const loadUser = useAuthStore((s) => s.loadUser)
  // The effect must run exactly once: it scrubs the query string it reads
  // from, so a second pass would see no token and bounce a successfully
  // signed-in user to /login.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = params.get('token')
    const refresh = params.get('refresh')

    if (!token) {
      toast.error('Authentication failed')
      router.replace('/login')
      return
    }

    // The SSO provider hands both tokens back in the URL query string, and
    // the refresh token is a 30-day credential. Left in the address bar it
    // ends up in browser history (recoverable on a shared machine) and in
    // any CDN/proxy access log that records full request URLs. Overwrite
    // the history entry immediately, before the await below, so the
    // tokens are visible for as little time as possible.
    //
    // This is a mitigation, not a fix: the tokens were still sent as a
    // query string and may already be in the SSO provider's and the edge's
    // logs. The real fix is a one-time code exchanged via POST, which
    // needs a change on the API side too.
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }

    setTokens(token, refresh || '')
    ;(async () => {
      try {
        await loadUser()
        router.replace('/dashboard')
      } catch {
        toast.error('Sign-in failed, please try again')
        router.replace('/login?error=oauth')
      }
    })()
  }, [params, router, setTokens, loadUser])

  return <div className="flex min-h-screen items-center justify-center">Signing you in…</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Signing you in…</div>}>
      <AuthCallbackInner />
    </Suspense>
  )
}
