'use client'

import { motion } from 'framer-motion'
import { Quote, Unlink } from 'lucide-react'

export function ProblemSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">
              The &ldquo;Fragmented Context&rdquo; Problem
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              You list goals in Notion. You schedule meetings in Google Calendar. You track time in Toggl.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              <strong className="text-gray-900">These tools don&apos;t talk to each other.</strong> You lose momentum
              because you can&apos;t see the direct relationship between today&apos;s hours and tomorrow&apos;s
              achievements.
            </p>

            <div className="group relative mt-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-6">
              <div className="absolute left-0 top-0 h-full w-1 bg-[#f2cc0d]" />
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2cc0d]/15">
                    <Quote className="h-5 w-5 text-[#8a7307]" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium leading-relaxed text-gray-900">
                    &ldquo;I spent 8 hours at my desk but made zero progress on my main project.&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-gray-500">
                    The Fragmented Context Trap
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8">
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
                viewBox="0 0 400 300"
                fill="none"
              >
                <path d="M100 80 C 150 80, 150 200, 200 200" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M300 80 C 250 80, 250 200, 200 200" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="200" cy="200" r="4" fill="#EF4444" />
                <path d="M200 200 L 200 250" stroke="#EF4444" strokeWidth="2" />
              </svg>

              <div className="relative z-10 grid grid-cols-2 gap-8">
                <motion.div
                  initial={{ rotate: -3 }}
                  whileHover={{ rotate: 0 }}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-mono text-xs text-gray-500">NOTION.EXE</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded bg-gray-200" />
                    <div className="h-2 w-2/3 rounded bg-gray-200" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ rotate: 3 }}
                  whileHover={{ rotate: 0 }}
                  className="mt-8 rounded-lg border border-gray-200 bg-white p-4 shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-mono text-xs text-gray-500">CAL.APP</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div className="col-span-1 h-6 rounded bg-gray-200" />
                    <div className="col-span-2 h-6 rounded bg-gray-200" />
                    <div className="col-span-1 h-6 rounded bg-gray-200" />
                  </div>
                </motion.div>
              </div>

              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 rounded-full border border-red-500 bg-white px-4 py-2 font-mono text-sm font-bold text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Unlink className="h-4 w-4" />
                  SYNC_FAILED
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
