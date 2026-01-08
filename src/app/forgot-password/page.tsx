'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { GoalSlotBrand } from '@/components/goalslot-logo'
import { toast } from 'react-hot-toast'

import { authApi } from '@/lib/api'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Loading } from '@/components/ui/loading'

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Form data
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  // Send forgot password OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.forgotPassword({ email })
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

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.verifyOTP({ email, otp, purpose: 'FORGOT_PASSWORD' })
      return response.data
    },
    onSuccess: () => {
      toast.success('Code verified successfully!')
      setStep(3)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid or expired code')
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.resetPassword({ email, otp, newPassword })
      return response.data
    },
    onSuccess: () => {
      toast.success('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    },
  })

  // Handle step 1 submit (send OTP)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    sendOTPMutation.mutate(email)
  }

  // Handle step 2 submit (verify OTP)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    verifyOTPMutation.mutate()
  }

  // Handle step 3 submit (reset password)
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    resetPasswordMutation.mutate()
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
    <div className="flex min-h-screen items-center justify-center bg-brutalist-bg p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex justify-center">
          <GoalSlotBrand size="lg" tagline="Your growth, measured." />
        </Link>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={`h-2 w-12 border-2 border-secondary ${step === 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-2 w-12 border-2 border-secondary ${step === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-2 w-12 border-2 border-secondary ${step === 3 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {/* Reset Password Card */}
        <div className="card-brutal">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold uppercase">Reset Password</h1>
              <p className="mb-6 text-center font-mono text-sm text-gray-600">
                Enter your email to receive a verification code
              </p>

              <form onSubmit={handleStep1Submit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={sendOTPMutation.isPending}
                  className="btn-brutal flex w-full items-center justify-center gap-2"
                >
                  {sendOTPMutation.isPending ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase text-gray-600 hover:text-secondary"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <h1 className="mb-2 text-center text-2xl font-bold uppercase">Verify Code</h1>
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
                  disabled={verifyOTPMutation.isPending || otp.length !== 6}
                  className="btn-brutal flex w-full items-center justify-center gap-2"
                >
                  {verifyOTPMutation.isPending ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      Verify Code <ArrowRight className="h-5 w-5" />
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

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="mb-6 flex flex-col items-center">
                <CheckCircle className="mb-3 h-12 w-12 text-green-600" />
                <h1 className="mb-2 text-center text-2xl font-bold uppercase">Set New Password</h1>
                <p className="text-center font-mono text-sm text-gray-600">Create a strong password for your account</p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-brutal pl-12 pr-12"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="btn-brutal flex w-full items-center justify-center gap-2"
                >
                  {resetPasswordMutation.isPending ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      Reset Password <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center font-mono text-sm">
            Remember your password?{' '}
            <Link href="/login" className="font-bold text-accent-blue hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
