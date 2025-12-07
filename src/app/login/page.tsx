'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen bg-brutalist-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-14 h-14 bg-primary border-3 border-secondary shadow-brutal flex items-center justify-center">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl uppercase tracking-tight">Time Master</span>
            <span className="block text-xs font-mono uppercase text-gray-600">DevWeekends</span>
          </div>
        </Link>

        {/* Login Card */}
        <div className="card-brutal">
          <h1 className="text-2xl font-bold uppercase text-center mb-6">Welcome Back</h1>

          {/* SSO Button */}
          <button
            onClick={handleSSOLogin}
            className="w-full btn-brutal-dark flex items-center justify-center gap-3 mb-6"
          >
            <Zap className="w-5 h-5" />
            Login with DevWeekends
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 font-mono text-sm text-gray-500 uppercase">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold uppercase text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              <label className="block font-bold uppercase text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="w-full btn-brutal flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Login <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center font-mono text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-accent-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center font-mono text-xs text-gray-500 mt-6">
          DevWeekends members get Pro access for free! ⚡
        </p>
      </motion.div>
    </div>
  )
}
