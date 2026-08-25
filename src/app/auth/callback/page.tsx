'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { consumePostLoginRedirect, isSafeInternalPath } from '@/lib/post-login-redirect'
import { useAuthStore } from '@/lib/store'

function AuthCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const setTokens = useAuthStore((s) => s.setTokens)
  const loadUser = useAuthStore((s) => s.loadUser)

  useEffect(() => {
    const token = params.get('token')
    const refresh = params.get('refresh')

    if (!token) {
      toast.error('Authentication failed')
      router.replace('/login')
      return
    }

    setTokens(token, refresh || '')

    // Where to land after sign-in. Set by /login before it handed off to
    // Google, or passed straight through if the provider ever forwards it.
    // Only same-origin relative paths are honoured, so this cannot be turned
    // into an open redirect.
    const passedThrough = params.get('redirect')
    const destination =
      (isSafeInternalPath(passedThrough) ? passedThrough : null) ??
      consumePostLoginRedirect() ??
      '/dashboard'

    ;(async () => {
      try {
        await loadUser()
        router.replace(destination)
      } catch (err) {
        toast.error('Sign-in failed, please try again')
        router.replace('/login?error=oauth')
      }
    })()
  }, [params, router, setTokens, loadUser])

  return <div className="flex min-h-screen items-center justify-center">Signing you in…</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Signing you in…</div>}
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
