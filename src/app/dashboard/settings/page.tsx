'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CategoryManagement } from '@/features/categories/components/category-management'
import { motion } from 'framer-motion'
import { Check, CreditCard, Crown, Download, Eye, EyeOff, Key, LogOut, Shield, Tag, Trash2, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { authApi, stripeApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data & Privacy', icon: Download },
]

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuthStore()

  const tabFromUrl = searchParams.get('tab')
  // Derive activeTab directly from URL query parameter
  const activeTab = tabFromUrl && TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'profile'

  const handleTabChange = (tabId: string) => {
    // Update URL query parameter without scrolling - component will re-render with new activeTab
    router.replace(`/dashboard/settings?tab=${tabId}`, { scroll: false })
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    // Refresh page to clear all cached data
    window.location.href = '/'
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">Settings</h1>
        <p className="font-mono uppercase text-gray-600">Manage your account</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card-brutal overflow-hidden p-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-left border-b-2 border-secondary transition-all',
                  activeTab === tab.id ? 'bg-primary' : 'hover:bg-gray-100',
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold uppercase text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'data' && <DataSettings />}
        </div>
      </div>
    </div>
  )
}

// Profile Settings
function ProfileSettings() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await usersApi.updateProfile({ name })
      setUser(res.data)
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="card-brutal">
        <h2 className="mb-6 text-xl font-bold uppercase">Profile Information</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-brutal" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Email Address</label>
            <div className="flex gap-4">
              <input type="email" value={email} disabled className="input-brutal flex-1 opacity-75" />
              <span className="border-3 border-secondary bg-gray-100 px-4 py-3 font-mono text-sm">
                {user?.userType === 'SSO' ? 'SSO' : 'Verified'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="pt-4">
            <button onClick={handleSave} disabled={isLoading} className="btn-brutal-dark">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Type */}
      <div className="card-brutal">
        <h2 className="mb-4 text-xl font-bold uppercase">Account Type</h2>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'px-4 py-2 font-bold uppercase border-3 border-secondary',
              user?.plan === 'PREMIUM' ? 'bg-primary' : 'bg-gray-100',
            )}
          >
            {user?.plan === 'PREMIUM' ? '👑 Premium' : 'Free Plan'}
          </div>
          <div className="font-mono text-sm text-gray-600">
            {user?.userType === 'SSO' && 'Connected via SSO'}
            {user?.userType === 'INTERNAL' && 'Internal Account'}
            {user?.userType === 'EXTERNAL' && 'External Account'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Billing Settings
function BillingSettings() {
  const { user, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const res = await stripeApi.createCheckoutSession('premium_monthly')
      // Redirect to Stripe checkout
      window.location.href = res.data.url
    } catch (error) {
      toast.error('Failed to start checkout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManage = async () => {
    setIsLoading(true)
    try {
      const res = await stripeApi.createPortalSession()
      window.location.href = res.data.url
    } catch (error) {
      toast.error('Failed to open billing portal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Current Plan */}
      <div className={cn('card-brutal p-8', user?.plan === 'PREMIUM' ? 'bg-primary' : 'bg-white')}>
        <div className="mb-4 flex items-center gap-4">
          {user?.plan === 'PREMIUM' ? <Crown className="h-10 w-10" /> : <CreditCard className="h-10 w-10" />}
          <div>
            <h2 className="text-2xl font-bold uppercase">{user?.plan === 'PREMIUM' ? 'Premium Plan' : 'Free Plan'}</h2>
            <p className="font-mono">{user?.plan === 'PREMIUM' ? '$10/month' : '$0/month'}</p>
          </div>
        </div>

        {user?.plan === 'FREE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>✓ 5 Schedule Blocks</div>
              <div>✓ 3 Goals Max</div>
              <div>✓ 3 Time Entries/Day</div>
              <div>✓ Basic Reports</div>
            </div>
            <button onClick={handleUpgrade} disabled={isLoading} className="btn-brutal-dark w-full">
              {isLoading ? 'Loading...' : 'Upgrade to Premium - $10/month'}
            </button>
          </div>
        )}

        {user?.plan === 'PREMIUM' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>✓ Unlimited Schedules</div>
              <div>✓ Unlimited Goals</div>
              <div>✓ Unlimited Time Entries</div>
              <div>✓ Advanced Reports</div>
              <div>✓ Priority Support</div>
            </div>
            <button onClick={handleManage} disabled={isLoading} className="btn-brutal-dark">
              {isLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}
      </div>

      {/* Premium Features */}
      {user?.plan === 'FREE' && (
        <div className="card-brutal">
          <h3 className="mb-4 text-xl font-bold uppercase">Premium Benefits</h3>
          <div className="space-y-3">
            {[
              'Unlimited schedule blocks',
              'Unlimited goals',
              'Unlimited time entries per day',
              'Advanced analytics & reports',
              'Priority support',
              'Early access to new features',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-accent-green" />
                <span className="font-mono">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Security Settings
function SecuritySettings() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<'enter-password' | 'verify-otp'>('enter-password')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Password visibility states
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
      const message = error.response?.data?.message || 'Failed to send verification code'
      toast.error(message)
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
      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setOtp('')
      setStep('enter-password')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password'
      toast.error(message)
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {user?.userType !== 'SSO' && (
        <div className="card-brutal">
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
                    className="input-brutal pr-12"
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
                <button onClick={handleSendOTP} disabled={isLoading || !currentPassword} className="btn-brutal-dark">
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
              <div className="rounded-lg border-2 border-secondary bg-blue-50 p-4">
                <p className="font-mono text-sm text-gray-700">
                  <strong>Security Notice:</strong> You'll receive a verification code via email to confirm your
                  password change.
                </p>
              </div>
            </div>
          )}

          {step === 'verify-otp' && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-secondary bg-primary p-4">
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
                          className="h-14 w-14 border-3 border-secondary bg-white text-xl font-bold uppercase shadow-brutal"
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
                    className="input-brutal pr-12"
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
                    className="input-brutal pr-12"
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
                  className="btn-brutal-dark"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button onClick={handleCancel} disabled={isLoading} className="btn-brutal">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {user?.userType === 'SSO' && (
        <div className="card-brutal">
          <h2 className="mb-4 text-xl font-bold uppercase">SSO Authentication</h2>
          <p className="font-mono text-gray-600">
            Your account is managed via SSO. Password changes should be made through your SSO account.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// Data Settings
function DataSettings() {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
      return
    }

    setIsDeleting(true)
    try {
      await usersApi.deleteAccount()
      toast.success('Account deleted')
      window.location.href = '/'
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="card-brutal border-red-500">
        <h2 className="mb-4 text-xl font-bold uppercase text-red-600">Danger Zone</h2>
        <p className="mb-4 font-mono text-gray-600">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="active:translate-x-brutal active:translate-y-brutal flex items-center gap-2 border-3 border-secondary bg-red-500 px-6 py-3 font-bold uppercase text-white shadow-brutal transition-all hover:shadow-brutal-hover active:shadow-none"
        >
          <Trash2 className="h-5 w-5" />
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </motion.div>
  )
}
