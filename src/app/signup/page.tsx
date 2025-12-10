'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2, Lock, Mail, User, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPro = searchParams.get('plan') === 'pro'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    const dwPlatformUrl = process.env.NEXT_PUBLIC_DW_PLATFORM_URL || 'https://devweekends.com'
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
            <span className="block font-mono text-xs uppercase text-gray-600">DevWeekends</span>
          </div>
        </Link>

        {/* Plan Badge */}
        {isPro && (
          <div className="mb-6 border-3 border-secondary bg-primary p-4 text-center shadow-brutal">
            <span className="font-bold uppercase">⚡ Pro Plan Selected</span>
            <p className="mt-1 font-mono text-sm">You'll be redirected to checkout after signup</p>
          </div>
        )}

        {/* Signup Card */}
        <div className="card-brutal">
          <h1 className="mb-6 text-center text-2xl font-bold uppercase">Create Account</h1>

          {/* SSO Button */}
          <button
            onClick={handleSSOSignup}
            className="btn-brutal-dark mb-6 flex w-full items-center justify-center gap-3"
          >
            <Zap className="h-5 w-5" />
            Sign up with DevWeekends
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 font-mono text-sm uppercase text-gray-500">Or sign up with email</span>
            </div>
          </div>

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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-brutal pl-12"
                  required
                  minLength={8}
                />
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

          {/* Features List */}
          <div className="mt-6 border-t-2 border-gray-200 pt-6">
            <p className="mb-3 text-sm font-bold uppercase">Free plan includes:</p>
            <ul className="space-y-2">
              {['3 Active Goals', '5 Schedule Blocks', '3 Tasks/Day'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 font-mono text-sm">
                  <Check className="h-4 w-4 text-accent-green" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

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
