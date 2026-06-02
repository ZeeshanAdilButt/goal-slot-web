'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function SettingsProfileTab() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await usersApi.updateProfile({ name })
      setUser(res.data)
      toast.success('Profile updated!')
    } catch {
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
                <span className="rounded bg-emerald-100 px-1.5 py-[1px] text-[10px] font-bold uppercase text-emerald-700">
                  Unlimited
                </span>
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
            <div className="truncate text-[11px] text-zinc-500">{user?.email || ''}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Email Address</label>
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                value={email}
                disabled
                className="h-10 w-full flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm opacity-75 transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              />
              <span className="border border-zinc-200 bg-gray-100 px-4 py-3 text-center font-mono text-sm sm:text-left">
                {user?.userType === 'SSO' ? 'SSO' : 'Verified'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-gray-500">Email cannot be changed</p>
          </div>
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold uppercase">Account Type</h2>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'border border-zinc-200 px-4 py-2 font-bold uppercase',
              user?.plan === 'BASIC' || user?.plan === 'PRO' ? 'bg-primary' : 'bg-gray-100',
            )}
          >
            {user?.plan === 'PRO' && '🚀 Max'}
            {user?.plan === 'BASIC' && '⭐ Pro'}
            {(user?.plan === 'FREE' || !user?.plan) && 'Free Plan'}
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
