'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPro = searchParams.get('plan') === 'pro'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const register = useAuthStore((state) => state.register)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await register(email, password, name)
      toast.success('Account created successfully!')

      if (isPro) {
        router.push('/billing/checkout')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOSignup = () => {
    const dwPlatformUrl = process.env.NEXT_PUBLIC_DW_PLATFORM_URL || 'https://example.com'
    const returnUrl = `${window.location.origin}/auth/callback`
    window.location.href = `${dwPlatformUrl}/auth/sso?redirect=${encodeURIComponent(returnUrl)}&signup=true`
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brutalist-bg p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center border-3 border-secondary bg-primary shadow-brutal">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold uppercase tracking-tight">Time Master</span>
            <span className="block font-mono text-xs uppercase text-gray-600">Productivity Tracker</span>
          </div>
        </Link>

        {/* Plan Badge */}
        {isPro && (
          <div className="mb-6 border-3 border-secondary bg-primary p-4 text-center shadow-brutal">
            <span className="font-bold uppercase">Pro Plan Selected</span>
            <p className="mt-1 font-mono text-sm">You'll be redirected to checkout after signup</p>
          </div>
        )}

        {/* Signup Card */}
        <div className="card-brutal">
          <h1 className="mb-6 text-center text-2xl font-bold uppercase">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-brutal pl-12"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-brutal pl-12"
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
                  className="input-brutal pl-12 pr-12"
                  required
                  minLength={8}
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
              <p className="mt-1 font-mono text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-brutal flex w-full items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-accent-blue hover:underline">
              Login
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brutalist-bg p-6">
          <div className="w-full max-w-md">
            <div className="card-brutal">
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
