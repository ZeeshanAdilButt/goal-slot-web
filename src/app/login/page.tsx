'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Lock, Mail, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = () => {
    // Redirect to DevWeekends platform for SSO
    const dwPlatformUrl = process.env.NEXT_PUBLIC_DW_PLATFORM_URL || 'https://devweekends.com'
    const returnUrl = `${window.location.origin}/auth/callback`
    window.location.href = `${dwPlatformUrl}/auth/sso?redirect=${encodeURIComponent(returnUrl)}`
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

        {/* Login Card */}
        <div className="card-brutal">
          <h1 className="mb-6 text-center text-2xl font-bold uppercase">Welcome Back</h1>

          {/* SSO Button */}
          <button
            onClick={handleSSOLogin}
            className="btn-brutal-dark mb-6 flex w-full items-center justify-center gap-3"
          >
            <Zap className="h-5 w-5" />
            Login with DevWeekends
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 font-mono text-sm uppercase text-gray-500">Or continue with email</span>
            </div>
          </div>

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
                />
              </div>
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
                  Login <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-accent-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-gray-500">
          DevWeekends members get Pro access for free! ⚡
        </p>
      </motion.div>
    </div>
  )
}
