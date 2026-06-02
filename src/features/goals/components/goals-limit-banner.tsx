'use client'

import Link from 'next/link'

import { AlertTriangle, Crown } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

interface GoalsLimitBannerProps {
  activeGoalsCount: number
}

export function GoalsLimitBanner({ activeGoalsCount }: GoalsLimitBannerProps) {
  const { user } = useAuthStore()

  if (!user) return null

  const maxGoals = user.limits?.maxGoals ?? 3
  const isUnlimited = user.plan === 'PRO' || user.unlimitedAccess || user.userType === 'INTERNAL'
  const isOverLimit = !isUnlimited && activeGoalsCount > maxGoals
  const excessGoals = activeGoalsCount - maxGoals

  // Don't show banner if user is within their limit
  if (!isOverLimit) return null

  // Check if subscription has expired (had a paid plan but now effectively on free limits)
  const hadPaidPlan = user.plan !== 'FREE'
  const isExpired = user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()

  return (
    <GlassCard className="border-amber-200 bg-amber-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {hadPaidPlan && isExpired ? 'Subscription Expired' : 'Goal Limit Reached'}
            </h3>
            <p className="mt-1 text-sm text-zinc-700">
              You have <strong>{activeGoalsCount}</strong> active goals but your current plan allows{' '}
              <strong>{maxGoals}</strong>.{' '}
              {excessGoals === 1
                ? `1 goal cannot be tracked until you upgrade or remove it.`
                : `${excessGoals} goals cannot be tracked until you upgrade or remove them.`}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Goals created first will remain active. You can pause or delete goals to stay within your limit.
            </p>
          </div>
        </div>
        <Button asChild variant="brand" className="shrink-0">
          <Link href="/dashboard/settings#billing">
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Link>
        </Button>
      </div>
    </GlassCard>
  )
}
