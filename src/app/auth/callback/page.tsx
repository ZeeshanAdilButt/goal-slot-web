'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
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

    ;(async () => {
      try {
        await loadUser()
        router.replace('/dashboard')
      } catch (err) {
        toast.error('Sign-in failed, please try again')
        router.replace('/login?error=oauth')
      }
    })()
  }, [params, router, setTokens, loadUser])

  return <div className="min-h-screen flex items-center justify-center">Signing you in…</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Signing you in…</div>}
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
