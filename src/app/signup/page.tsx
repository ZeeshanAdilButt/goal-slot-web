'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Loading } from '@/components/ui/loading'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPro = searchParams.get('plan') === 'pro'
  const redirect = searchParams.get('redirect')

  // Step management
  const [step, setStep] = useState<1 | 2>(1)

  // Form data
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  const register = useAuthStore((state) => state.register)

  // Check email exists mutation
  const checkEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.checkEmailExists(email)
      return response.data
    },
  })

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.sendOTP({ email, purpose: 'SIGNUP' })
      return response.data
    },
    onSuccess: () => {
      toast.success('Verification code sent to your email!')
      setStep(2)
      setResendCooldown(60)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send verification code')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      await register(email, password, name, otp)
    },
    onSuccess: () => {
      toast.success('Account created successfully!')
      // Redirect to the specified URL, or to checkout if Pro plan, or default to dashboard
      if (redirect) {
        router.push(redirect)
      } else if (isPro) {
        router.push('/billing/checkout')
      } else {
        router.push('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed')
    },
  })

  // Handle step 1 submit (send OTP)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    // Check if email exists
    const emailCheck = await checkEmailMutation.mutateAsync(email)
    if (emailCheck.exists) {
      toast.error('Email already registered. Please login instead.')
      return
    }

    // Send OTP
    sendOTPMutation.mutate(email)
  }

  // Handle step 2 submit (verify OTP and register)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    registerMutation.mutate()
  }

  // Handle resend OTP
  const handleResendOTP = () => {
    if (resendCooldown > 0) return
    sendOTPMutation.mutate(email)
  }

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brutalist-bg p-2 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center border-3 border-secondary bg-primary shadow-brutal">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold uppercase tracking-tight">GoalSlot</span>
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

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={`h-2 w-16 border-2 border-secondary ${step === 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-2 w-16 border-2 border-secondary ${step === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {/* Signup Card */}
        <div className="card-brutal">
          {step === 1 ? (
            <>
              <h1 className="mb-6 text-center text-2xl font-bold uppercase">Create Account</h1>
              <form onSubmit={handleStep1Submit} className="space-y-4">
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
                  disabled={sendOTPMutation.isPending || checkEmailMutation.isPending}
                  className="btn-brutal flex w-full items-center justify-center gap-2"
                >
                  {sendOTPMutation.isPending || checkEmailMutation.isPending ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase text-gray-600 hover:text-secondary"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <h1 className="mb-2 text-center text-2xl font-bold uppercase">Verify Email</h1>
              <p className="mb-6 text-center font-mono text-sm text-gray-600">
                We sent a 6-digit code to <span className="font-bold">{email}</span>
              </p>

              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div className="flex flex-col items-center">
                  <label className="mb-3 block text-sm font-bold uppercase">Enter Verification Code</label>
                  <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                      <InputOTPSlot
                        index={2}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                      <InputOTPSlot
                        index={3}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                      <InputOTPSlot
                        index={4}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                      <InputOTPSlot
                        index={5}
                        className="h-14 w-14 border-3 border-secondary text-xl font-bold shadow-brutal"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="mt-2 font-mono text-xs text-gray-500">Code expires in 5 minutes</p>
                </div>

                <button
                  type="submit"
                  disabled={registerMutation.isPending || otp.length !== 6}
                  className="btn-brutal flex w-full items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      Verify & Create Account <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || sendOTPMutation.isPending}
                    className="font-mono text-sm font-bold uppercase text-accent-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendCooldown > 0
                      ? `Resend Code (${resendCooldown}s)`
                      : sendOTPMutation.isPending
                        ? 'Sending...'
                        : 'Resend Code'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-center font-mono text-sm">
            Already have an account?{' '}
            <Link
              href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
              className="font-bold text-accent-blue hover:underline"
            >
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
        <div className="flex min-h-screen items-center justify-center bg-brutalist-bg p-2 sm:p-6">
          <div className="w-full max-w-md">
            <div className="card-brutal">
              <div className="flex items-center justify-center p-8">
                <Loading size="sm" />
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
