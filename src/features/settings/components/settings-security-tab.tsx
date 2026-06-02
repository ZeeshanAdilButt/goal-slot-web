'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import { Eye, EyeOff, Key } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

export function SettingsSecurityTab() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<'enter-password' | 'verify-otp'>('enter-password')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSendOTP = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    setIsLoading(true)
    try {
      await authApi.sendChangePasswordOTP({ currentPassword })
      toast.success('Verification code sent to your email')
      setStep('verify-otp')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await authApi.changePassword({ currentPassword, otp, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setOtp('')
      setStep('enter-password')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setStep('enter-password')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (user?.userType === 'SSO') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold uppercase">SSO Authentication</h2>
          <p className="font-mono text-gray-600">
            Your account is managed via SSO. Password changes should be made through your SSO account.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase">
          <Key className="h-5 w-5" />
          Change Password
        </h2>

        {step === 'enter-password' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSendOTP}
                disabled={isLoading || !currentPassword}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-blue-50 p-4">
              <p className="font-mono text-sm text-gray-700">
                <strong>Security Notice:</strong> You&apos;ll receive a verification code via email to confirm your
                password change.
              </p>
            </div>
          </div>
        )}

        {step === 'verify-otp' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-primary p-4">
              <p className="mb-2 font-bold uppercase">Verification Code Sent!</p>
              <p className="font-mono text-sm">Check your email for the 6-digit code and enter it below.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Verification Code</label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-14 w-14 border border-zinc-200 bg-white text-xl font-bold uppercase shadow-sm"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 font-mono text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleChangePassword}
                disabled={isLoading || !otp || !newPassword || !confirmPassword}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
