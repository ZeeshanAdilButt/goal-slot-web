'use client'

import { motion } from 'framer-motion'
import { Check, CreditCard, Crown } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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

export function SettingsBillingTab() {
  const { user } = useAuthStore()
  const currentPlan = (user?.plan ?? 'FREE') as 'FREE' | 'BASIC' | 'PRO'
  const planMeta = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0]
  const isOnPaidPlan = currentPlan !== 'FREE'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
          Self-serve plan changes are coming soon. To upgrade or change your plan in the meantime, email{' '}
          <a
            href="mailto:support@goalslot.com?subject=Plan%20change"
            className="font-medium text-[#8a7307] underline hover:text-zinc-900"
          >
            support@goalslot.com
          </a>{' '}
          - include the plan you want and we&apos;ll set it up.
        </div>
      </div>

      <div>
        <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Compare plans</h3>
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
                    className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    Email to switch to {plan.name}
                  </a>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-3 px-1 text-[11px] text-zinc-500">
          Plan limits are enforced by the backend (see{' '}
          <code className="font-mono">plan-limits.ts</code>).
        </p>
      </div>
    </motion.div>
  )
}
