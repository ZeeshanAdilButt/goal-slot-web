'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CategoryManagement } from '@/features/categories/components/category-management'
import { SettingsCoachProfileTab, SettingsIntegrationsTab } from '@/features/settings'
import { motion } from 'framer-motion'
import { Brain, Check, CreditCard, Crown, Download, Eye, EyeOff, Key, KeyRound, LogOut, Moon, Palette, Shield, Sun, Tag, Trash2, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { authApi, stripeApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useThemeStore } from '@/lib/use-theme'
import { cn } from '@/lib/utils'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data & Privacy', icon: Download },
  { id: 'integrations', label: 'Integrations', icon: KeyRound },
  { id: 'coach-profile', label: 'Coach Profile', icon: Brain },
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
    <PageShell>
      <PageHeader eyebrow="Account" title="Settings" description="Manage your account" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left text-sm font-semibold transition-colors last:border-b-0',
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'data' && <DataSettings />}
          {activeTab === 'integrations' && <SettingsIntegrationsTab />}
          {activeTab === 'coach-profile' && <SettingsCoachProfileTab />}
        </div>
      </div>
    </PageShell>
  )
}

// Appearance Settings — dark / light theme toggle. Persists via the
// useThemeStore zustand store; the dashboard layout reads it on mount
// and toggles the `dark` class on <html>.
function AppearanceSettings() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const options: { value: 'light' | 'dark'; label: string; description: string; icon: typeof Sun }[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright surfaces, dark text. Best for daytime.',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Deep zinc surfaces, brand-yellow accents. Easy on the eyes at night.',
      icon: Moon,
    },
  ]

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Theme</h2>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          Applies across the whole app. The journal page always renders in dark, regardless of this setting.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isActive = theme === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={isActive}
              className={cn(
                'group flex flex-col gap-2 rounded-lg border p-4 text-left transition-all',
                isActive
                  ? 'border-[#f2cc0d] bg-[#fffbea] ring-2 ring-[#f2cc0d]/40'
                  : 'border-zinc-200 bg-white hover:border-zinc-300',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-[#f2cc0d]">
                  <Icon className="h-4 w-4" />
                </span>
                {isActive && (
                  <span className="inline-flex h-5 items-center gap-1 rounded-full bg-zinc-900 px-2 text-[10px] font-semibold tracking-tight text-[#f2cc0d]">
                    Active
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900">{opt.label}</div>
                <div className="mt-0.5 text-[12px] text-zinc-500">{opt.description}</div>
              </div>
            </button>
          )
        })}
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

  const role = user?.role || 'USER'
  const plan = (user?.plan ?? 'FREE') as 'FREE' | 'BASIC' | 'PRO'
  const isPro = plan === 'PRO' || user?.unlimitedAccess

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-bold uppercase">Profile Information</h2>
        <p className="mb-5 text-xs text-zinc-500">Your account, role, and plan at a glance.</p>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">User type</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'User'}
            </div>
            <div className="text-[11px] text-zinc-500">
              {user?.userType === 'SSO' && 'Signed in via SSO'}
              {user?.userType === 'INTERNAL' && 'Internal account'}
              {user?.userType === 'EXTERNAL' && 'External account'}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Subscription</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  'rounded px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wider',
                  isPro ? 'bg-[#fff7d1] text-[#8a7307]' : plan === 'BASIC' ? 'bg-sky-100 text-sky-800' : 'bg-zinc-200 text-zinc-700',
                )}
              >
                {plan}
              </span>
              {user?.unlimitedAccess && (
                <span className="rounded bg-emerald-100 px-1.5 py-[1px] text-[10px] font-bold uppercase text-emerald-700">Unlimited</span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              {isPro ? 'Full access' : plan === 'BASIC' ? 'Mid tier' : 'Free tier'}
            </div>
          </div>
          <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Auth</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {user?.userType === 'SSO' ? 'Single sign-on' : 'Email + password'}
            </div>
            <div className="text-[11px] text-zinc-500 truncate">{user?.email || ''}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Email Address</label>
            <div className="flex flex-col gap-4 sm:flex-row">
              <input type="email" value={email} disabled className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] flex-1 opacity-75" />
              <span className="border border-zinc-200 bg-gray-100 px-4 py-3 text-center font-mono text-sm sm:text-left">
                {user?.userType === 'SSO' ? 'SSO' : 'Verified'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="pt-4">
            <button onClick={handleSave} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Type */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold uppercase">Account Type</h2>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'px-4 py-2 font-bold uppercase border border-zinc-200',
              user?.plan === 'BASIC' || user?.plan === 'PRO' ? 'bg-primary' : 'bg-gray-100',
            )}
          >
            {user?.plan === 'PRO' && '🚀 Max'}
            {user?.plan === 'BASIC' && '⭐ Pro'}
            {user?.plan === 'FREE' && 'Free Plan'}
            {!user?.plan && 'Free Plan'}
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
//
// Self-serve billing (Stripe checkout + portal) is intentionally hidden for
// now — payment integration ships later. This surface stays informational:
// shows the user's current plan, the full tier matrix with verified limits,
// and a "Contact us" path for upgrades. Plan names match the backend
// (FREE / BASIC / PRO) so reports + plan-limits stay consistent.
function BillingSettings() {
  const { user } = useAuthStore()
  const currentPlan = (user?.plan ?? 'FREE') as 'FREE' | 'BASIC' | 'PRO'

  const PLANS: Array<{
    id: 'FREE' | 'BASIC' | 'PRO'
    name: string
    price: string
    suffix?: string
    blurb: string
    features: string[]
  }> = [
    {
      id: 'FREE',
      name: 'Free',
      price: '$0',
      blurb: 'Start the habit',
      features: ['3 active goals', '5 schedule blocks', '3 tasks per day', 'Basic reports'],
    },
    {
      id: 'BASIC',
      name: 'Basic',
      price: '$7',
      suffix: '/mo',
      blurb: 'Outgrow the free limits',
      features: ['10 active goals', 'Unlimited schedule blocks', 'Unlimited tasks per day', 'Share with a mentor'],
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '$10',
      suffix: '/mo',
      blurb: 'Go unlimited',
      features: ['Unlimited everything', 'Advanced analytics', 'CSV / PDF export', 'Priority support'],
    },
  ]

  const planMeta = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0]
  const isOnPaidPlan = currentPlan !== 'FREE'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Current plan summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg sm:h-14 sm:w-14',
                isOnPaidPlan ? 'bg-[#f2cc0d]/15 text-[#8a7307]' : 'bg-zinc-100 text-zinc-500',
              )}
            >
              {isOnPaidPlan ? (
                <Crown className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <CreditCard className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current plan</p>
              <h2 className="text-2xl font-bold text-zinc-900">{planMeta.name}</h2>
              <p className="text-sm text-zinc-600">
                <span className="font-mono">{planMeta.price}</span>
                {planMeta.suffix ?? ''} · {planMeta.blurb}
              </p>
            </div>
          </div>
          <span className="inline-flex h-7 items-center self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700">
            {isOnPaidPlan ? 'Active' : 'No payment required'}
          </span>
        </div>

        <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Self-serve plan changes are coming soon. To upgrade or change your plan in the meantime,
          email{' '}
          <a
            href="mailto:support@goalslot.com?subject=Plan%20change"
            className="font-medium text-[#8a7307] underline hover:text-zinc-900"
          >
            support@goalslot.com
          </a>
          {' '}- include the plan you want and we'll set it up.
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Compare plans
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            return (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-xl border bg-white p-5 transition-all',
                  isCurrent
                    ? 'border-[#f2cc0d] shadow-[0_8px_24px_-12px_rgba(242,204,13,0.35)]'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm',
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">{plan.name}</h4>
                    <p className="mt-1 text-xs text-zinc-500">{plan.blurb}</p>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex h-6 items-center rounded-full bg-[#f2cc0d] px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-900">
                      Current
                    </span>
                  )}
                </div>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-zinc-900">{plan.price}</span>
                  {plan.suffix && <span className="text-sm text-zinc-500">{plan.suffix}</span>}
                </div>
                <ul className="mb-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <a
                    href={`mailto:support@goalslot.com?subject=Upgrade%20to%20${plan.name}%20plan`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                  >
                    Email to switch to {plan.name}
                  </a>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-3 px-1 text-[11px] text-zinc-500">
          Plan limits are enforced by the backend (see <code className="font-mono">plan-limits.ts</code>).
        </p>
      </div>
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
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] pr-12"
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
                <button onClick={handleSendOTP} disabled={isLoading || !currentPassword} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-blue-50 p-4">
                <p className="font-mono text-sm text-gray-700">
                  <strong>Security Notice:</strong> You'll receive a verification code via email to confirm your
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
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] pr-12"
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
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] pr-12"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button onClick={handleCancel} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {user?.userType === 'SSO' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm border-red-500">
        <h2 className="mb-4 text-xl font-bold uppercase text-red-600">Danger Zone</h2>
        <p className="mb-4 font-mono text-gray-600">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </motion.div>
  )
}
