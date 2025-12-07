'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, ArrowRight, Loader2, Check } from 'lucide-react'
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

        {/* Plan Badge */}
        {isPro && (
          <div className="bg-primary border-3 border-secondary shadow-brutal p-4 mb-6 text-center">
            <span className="font-bold uppercase">⚡ Pro Plan Selected</span>
            <p className="font-mono text-sm mt-1">You'll be redirected to checkout after signup</p>
          </div>
        )}

        {/* Signup Card */}
        <div className="card-brutal">
          <h1 className="text-2xl font-bold uppercase text-center mb-6">Create Account</h1>

          {/* SSO Button */}
          <button
            onClick={handleSSOSignup}
            className="w-full btn-brutal-dark flex items-center justify-center gap-3 mb-6"
          >
            <Zap className="w-5 h-5" />
            Sign up with DevWeekends
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 font-mono text-sm text-gray-500 uppercase">
                Or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold uppercase text-sm mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  minLength={8}
                />
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1">Minimum 8 characters</p>
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
                  Create Account <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Features List */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="font-bold text-sm uppercase mb-3">Free plan includes:</p>
            <ul className="space-y-2">
              {['3 Active Goals', '5 Schedule Blocks', '3 Tasks/Day'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 font-mono text-sm">
                  <Check className="w-4 h-4 text-accent-green" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center font-mono text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-accent-blue hover:underline">
              Login
            </Link>
          </p>
        </div>

        <p className="text-center font-mono text-xs text-gray-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
