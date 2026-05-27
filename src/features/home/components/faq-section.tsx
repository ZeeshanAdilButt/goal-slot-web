'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// Source of truth: dw-time-web/src/app/faq/page.tsx (the full FAQ page).
// Only items that match the actual product behavior are surfaced on the landing.
// Do NOT add fabricated answers (e.g. Google Calendar sync, streaks,
// leaderboards, 2FA, refund/student discounts) — they aren't in the product yet.

const faqs = [
  {
    q: 'Is GoalSlot free to use?',
    a: 'Yes. The Free plan lets you track 3 active goals, 5 schedule blocks, and 3 tasks per day — enough to build the habit. Upgrade when you outgrow the limits.',
  },
  {
    q: 'What’s the difference between goals and tasks?',
    a: 'Goals are your larger objectives (e.g. "Learn React" or "Ship MVP"). Tasks are smaller, actionable items you work on daily. Tasks can be linked to goals so completing them automatically logs time toward the bigger objective.',
  },
  {
    q: 'How do I track my time?',
    a: 'Use the timer on your dashboard to track time in real-time, or add manual entries after working. Each entry can be assigned to a goal, task, or schedule block — so every minute counts toward something.',
  },
  {
    q: 'Can I share my progress with my mentor?',
    a: 'Yes. From the Sharing tab you can invite a mentor (or accountability partner) to view your goals, time entries, and reports. They don’t need a paid plan to view what you share.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Reports can be exported as CSV or PDF from the Reports → Export page. You always own your data.',
  },
]

export function FAQSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">Frequently Asked Questions</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((f, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-lg border border-gray-200 bg-gray-50 p-6 transition-colors open:border-[#f2cc0d]/50"
            >
              <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-gray-900">
                {f.q}
                <span className="ml-4 text-2xl text-gray-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-gray-600">{f.a}</p>
            </motion.details>
          ))}
        </div>
        <div className="mt-10 text-center text-sm text-gray-500">
          More questions?{' '}
          <Link href="/faq" className="font-medium text-[#8a7307] hover:underline">
            See the full FAQ →
          </Link>
        </div>
      </div>
    </section>
  )
}
