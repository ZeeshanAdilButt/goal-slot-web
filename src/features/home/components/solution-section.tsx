'use client'

import { motion } from 'framer-motion'
import { Target, CalendarClock, Zap, BarChart2 } from 'lucide-react'

const steps = [
  {
    n: 1,
    Icon: Target,
    title: 'Define',
    body: 'Create a clear Goal with a deadline (e.g., "Ship MVP"). If it doesn’t have a deadline, it’s just a wish.',
  },
  {
    n: 2,
    Icon: CalendarClock,
    title: 'Schedule',
    body: 'Allocate recurring time blocks on the weekly calendar, linked directly to that Goal.',
  },
  {
    n: 3,
    Icon: Zap,
    title: 'Execute',
    body: 'Click the block to start the live timer. No more switching apps to track your time.',
  },
  {
    n: 4,
    Icon: BarChart2,
    title: 'Review',
    body: 'View automated reports. Did you actually put in the hours? The data provides the answer.',
  },
]

export function SolutionSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden border-y border-gray-200 bg-gray-50 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#f2cc0d]/10 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-bold text-gray-900 md:text-5xl"
          >
            The Unified Loop
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            GoalSlot forces a strict 4-step workflow to ensure intention matches action.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {steps.map(({ n, Icon, title, body }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-[#f2cc0d]"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-100">
                <Icon className="h-12 w-12 text-[#f2cc0d]" />
              </div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#f2cc0d] font-mono text-xl font-bold text-gray-900 shadow-[0_4px_12px_rgba(242,204,13,0.4)]">
                {n}
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900 transition-colors group-hover:text-[#8a7307]">
                {title}
              </h3>
              <p className="leading-relaxed text-gray-600">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
