'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #E5E7EB 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-bold text-gray-900 md:text-5xl"
        >
          Ready to regain control?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-xl text-gray-600"
        >
          Start tracking your deep work today. Free forever for the basics.
        </motion.p>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-10 flex max-w-md flex-col gap-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            window.location.href = '/signup'
          }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 rounded border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-[#f2cc0d] focus:outline-none focus:ring-2 focus:ring-[#f2cc0d]/20"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded bg-[#f2cc0d] px-8 py-3 font-bold text-gray-900 transition hover:bg-[#e0bd0a]"
          >
            Start Free
          </button>
        </motion.form>
        <p className="mt-4 text-xs text-gray-500">No credit card required for Entry plan.</p>
        <p className="mt-2 text-sm text-gray-500">
          Prefer a quick look first?{' '}
          <Link href="#how-it-works" className="font-medium text-[#8a7307] hover:underline">
            See how it works
          </Link>
        </p>
      </div>
    </section>
  )
}
