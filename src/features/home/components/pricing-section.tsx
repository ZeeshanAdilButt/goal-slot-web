'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// Plan names and limits MUST match dw-time-api/src/modules/auth/plan-limits.ts.
// FREE: 3 goals, 5 schedule blocks, 3 tasks/day.
// BASIC: 10 goals, unlimited schedules, unlimited tasks/day.
// PRO: unlimited everything.
// Pricing reflects the team's marketing doc; if pricing changes,
// update here AND in `dw-time-web/src/app/dashboard/settings/page.tsx` billing tab.

const tiers = [
  {
    name: 'Free',
    price: '$0',
    blurb: 'Start the habit',
    features: ['3 active goals', '5 schedule blocks', '3 tasks per day', 'Basic reports'],
    cta: 'Start Free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Basic',
    price: '$7',
    suffix: '/mo',
    blurb: 'Outgrow the free limits',
    features: ['10 active goals', 'Unlimited schedule blocks', 'Unlimited tasks per day', 'Share with a mentor'],
    cta: 'Get Basic',
    href: '/signup?plan=basic',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$10',
    suffix: '/mo',
    blurb: 'Go unlimited',
    features: ['Unlimited everything', 'Advanced analytics', 'CSV / PDF export', 'Priority support'],
    cta: 'Get Pro',
    href: '/signup?plan=pro',
    popular: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-gray-200 bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl font-bold text-gray-900"
          >
            Invest in your output
          </motion.h2>
          <p className="mt-4 text-gray-600">Simple pricing. Free forever for the basics.</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col rounded-xl bg-white p-8 ${
                t.popular
                  ? 'border-2 border-[#f2cc0d] shadow-[0_20px_50px_-15px_rgba(242,204,13,0.4)] md:-translate-y-4'
                  : 'border border-gray-200'
              }`}
            >
              {t.popular && (
                <div className="absolute right-0 top-0 rounded-bl rounded-tr-xl bg-[#f2cc0d] px-3 py-1 text-xs font-bold text-gray-900">
                  POPULAR
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                <div className="mt-2 font-display text-4xl font-bold text-gray-900">
                  {t.price}
                  {t.suffix && <span className="text-lg font-normal text-gray-500">{t.suffix}</span>}
                </div>
                <p className="mt-1 text-sm text-gray-500">{t.blurb}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    {t.popular ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f2cc0d]">
                        <Check className="h-3 w-3 text-gray-900" />
                      </span>
                    ) : (
                      <Check className="h-4 w-4 text-[#f2cc0d]" />
                    )}
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`block w-full rounded py-3 text-center font-semibold transition ${
                  t.popular
                    ? 'bg-[#f2cc0d] text-gray-900 hover:bg-[#e0bd0a]'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-gray-500">
          Plan limits enforced by the backend (see <code className="font-mono text-gray-600">plan-limits.ts</code>).
          No credit card required for the Free plan.
        </p>
      </div>
    </section>
  )
}
