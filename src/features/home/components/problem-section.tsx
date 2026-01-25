import { CloudOff, Lock } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function ProblemSection() {
  return (
    <section
      id="philosophy"
      className="w-full border-b-2 border-secondary bg-white px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
            The Fragmented vs. The Unified
          </h2>
          <p className="mt-4 text-lg text-gray-600">Stop context switching. Start finishing.</p>
        </div>

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          {/* The Chaos */}
          <AnimatedSection
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col rounded-sm border-2 border-secondary bg-gray-50 p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-gray-500">The Chaos</h3>
              <CloudOff className="h-10 w-10 text-gray-400" />
            </div>
            <p className="mb-8 font-medium text-gray-500">
              Scattered icons of Toggl, Notion, and Google Calendar fighting for attention. Data
              silos that kill momentum.
            </p>

            {/* Visual representation */}
            <div className="relative flex min-h-[250px] flex-1 items-center justify-center overflow-hidden rounded-sm border-2 border-dashed border-gray-300 bg-gray-200">
              {/* Scattered app icons */}
              <div className="absolute left-10 top-10 -rotate-12 rounded border border-gray-300 bg-white p-4 opacity-50 shadow-sm">
                <div className="h-8 w-8 rounded bg-blue-400"></div>
              </div>
              <div className="absolute bottom-12 right-12 rotate-6 rounded border border-gray-300 bg-white p-4 opacity-50 shadow-sm">
                <div className="h-8 w-8 rounded bg-green-400"></div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded border border-gray-300 bg-white p-4 opacity-50 shadow-sm">
                <div className="h-8 w-8 rounded bg-orange-400"></div>
              </div>
              <p className="z-10 bg-gray-200 px-2 font-bold text-gray-400">DISCONNECTED</p>
            </div>
          </AnimatedSection>

          {/* The Clarity */}
          <AnimatedSection
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative z-10 flex flex-col rounded-sm border-2 border-secondary bg-white p-8 shadow-brutal"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">The Clarity</h3>
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <p className="mb-8 font-medium text-gray-800">
              One unified GoalSlot Loop. Your goals, schedule, and time tracking—locked in sync. One
              source of truth for ambition and execution.
            </p>

            {/* Visual representation */}
            <div className="bg-grid relative flex min-h-[250px] flex-1 items-center justify-center overflow-hidden rounded-sm border-2 border-secondary">
              {/* Unified flow diagram - 4 core components */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-secondary bg-primary font-bold shadow-brutal-sm">
                  G
                </div>
                <div className="h-1 w-6 bg-secondary"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-secondary bg-green-400 font-bold shadow-brutal-sm">
                  S
                </div>
                <div className="h-1 w-6 bg-secondary"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-secondary bg-blue-400 font-bold shadow-brutal-sm">
                  T
                </div>
                <div className="h-1 w-6 bg-secondary"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-secondary bg-purple-400 font-bold shadow-brutal-sm">
                  R
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
              Goals → Schedule → Timer → Reports
            </p>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
