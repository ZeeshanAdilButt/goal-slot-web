'use client'

import { AlertTriangle, Crown } from 'lucide-react'
import Link from 'next/link'

import { useAuthStore } from '@/lib/store'

interface GoalsLimitBannerProps {
  activeGoalsCount: number
}

export function GoalsLimitBanner({ activeGoalsCount }: GoalsLimitBannerProps) {
  const { user } = useAuthStore()

  if (!user) return null

  const maxGoals = user.limits?.maxGoals ?? 3
  const isOverLimit = activeGoalsCount > maxGoals
  const excessGoals = activeGoalsCount - maxGoals

  // Don't show banner if user is within their limit
  if (!isOverLimit) return null

  // Check if subscription has expired (had a plan but now effectively on free limits)
  const hadPremium = user.plan !== 'FREE'
  const isExpired = user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()

  return (
    <div className="mb-6 border-3 border-secondary bg-amber-50 p-4 shadow-brutal">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-bold uppercase text-secondary">
              {hadPremium && isExpired ? 'Subscription Expired' : 'Goal Limit Reached'}
            </h3>
            <p className="mt-1 font-mono text-sm text-gray-700">
              You have <strong>{activeGoalsCount}</strong> active goals but your current plan allows{' '}
              <strong>{maxGoals}</strong>.{' '}
              {excessGoals === 1 
                ? `1 goal cannot be tracked until you upgrade or remove it.`
                : `${excessGoals} goals cannot be tracked until you upgrade or remove them.`}
            </p>
            <p className="mt-2 font-mono text-xs text-gray-500">
              Goals created first will remain active. You can pause or delete goals to stay within your limit.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings#billing"
          className="btn-brutal flex shrink-0 items-center justify-center gap-2 bg-primary text-secondary"
        >
          <Crown className="h-4 w-4" />
          Upgrade Plan
        </Link>
      </div>
    </div>
  )
}
