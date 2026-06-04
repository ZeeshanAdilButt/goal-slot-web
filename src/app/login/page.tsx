'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { GoalSlotBrand } from '@/components/goalslot-logo'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'
import { Loading } from '@/components/ui/loading'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back!')
      // Redirect to the specified URL or default to dashboard
      // If we are already on login page and not coming from anywhere specific, go to dashboard
      router.push(redirect || '/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = () => {
    // Redirect to SSO platform
    const dwPlatformUrl = process.env.NEXT_PUBLIC_DW_PLATFORM_URL
    const returnUrl = `${window.location.origin}/auth/callback`
    window.location.href = `${dwPlatformUrl}/auth/sso?redirect=${encodeURIComponent(returnUrl)}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-2 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex justify-center">
          <GoalSlotBrand size="lg" tagline="Your growth, measured." />
        </Link>

        {/* Login Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold uppercase">Welcome Back</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pl-12 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pl-12 pr-12 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-accent-blue font-mono text-xs font-bold uppercase hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {isLoading ? (
                <Loading size="sm" className="h-5 w-5" />
              ) : (
                <>
                  Login <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            <div className="mt-4">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-zinc-200" />
                <div className="mx-4 text-xs text-zinc-400">or</div>
                <div className="flex-grow border-t border-zinc-200" />
              </div>
              <button
                type="button"
                onClick={() =>
                  (window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/google`)
                }
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Continue with Google
              </button>
            </div>
          </form>

          <p className="mt-6 text-center font-mono text-sm">
            Don't have an account?{' '}
            <Link
              href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup'}
              className="text-accent-blue font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-center p-8">
                <Loading size="sm" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
