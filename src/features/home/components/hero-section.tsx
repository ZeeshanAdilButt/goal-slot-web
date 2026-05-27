'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { ArrowRight, PlayCircle } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-32 lg:pb-32 lg:pt-48">
      {/* Subtle dotted grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #E5E7EB 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#f2cc0d]/40 bg-[#f2cc0d]/10 px-3 py-1 font-mono text-xs font-medium text-[#8a7307]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2cc0d] opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]"></span>
            </span>
            KILL FRAGMENTED CONTEXT
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 md:text-7xl"
          >
            Stop Wishing.
            <br />
            <span className="text-[#f2cc0d]">Start Finishing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl"
          >
            The unified loop for ambitious builders. Define goals, block time, execute deep work, and prove your
            progress with data — all in one interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#f2cc0d] px-8 py-4 text-base font-semibold text-gray-900 transition-all hover:-translate-y-0.5 hover:bg-[#e0bd0a] hover:shadow-[0_8px_24px_rgba(242,204,13,0.35)]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-8 py-4 text-base font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50"
            >
              <PlayCircle className="h-5 w-5" />
              See the Loop
            </Link>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#f2cc0d] to-orange-400 opacity-20 blur-xl" />
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                </div>
                <div className="font-mono text-xs text-gray-400">workspace / q4-goals</div>
              </div>

              <div className="grid h-[400px] grid-cols-12 divide-x divide-gray-200">
                {/* Left: Goals */}
                <div className="hidden p-4 md:col-span-3 md:block">
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Goals</h3>
                  <div className="space-y-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <div className="text-sm font-semibold text-gray-900">Launch App</div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.2, delay: 1, ease: 'easeOut' }}
                          className="h-full bg-[#f2cc0d]"
                        />
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-3 opacity-60">
                      <div className="text-sm font-semibold text-gray-900">Learn Rust</div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '20%' }}
                          transition={{ duration: 1.2, delay: 1.2, ease: 'easeOut' }}
                          className="h-full bg-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center: Timer */}
                <div className="col-span-12 flex flex-col items-center justify-center p-6 md:col-span-6">
                  <div className="text-center">
                    <span className="rounded bg-[#f2cc0d]/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#8a7307]">
                      Deep Work Session
                    </span>
                    <h2 className="mt-4 font-display text-3xl font-bold text-gray-900">Landing Page Polish</h2>
                    <div className="mt-2 font-mono text-7xl font-bold tracking-tighter text-gray-900 tabular-nums">
                      01:14:22
                    </div>
                  </div>
                  <div className="mt-8 flex gap-3">
                    <button className="rounded border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                      Pause
                    </button>
                    <button className="rounded bg-gray-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                      Complete
                    </button>
                  </div>
                </div>

                {/* Right: Velocity */}
                <div className="hidden p-4 md:col-span-3 md:block">
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Velocity</h3>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900">22.5h</div>
                    <div className="text-[10px] text-gray-500">Focus time this week</div>
                  </div>
                  <div className="flex h-32 items-end justify-between gap-1 border-b border-gray-100 pb-2">
                    {[40, 60, 85, 50, 30].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 1 + i * 0.1, ease: 'easeOut' }}
                        className={`w-full rounded-sm ${i === 2 ? 'bg-[#f2cc0d]' : 'bg-gray-100'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
