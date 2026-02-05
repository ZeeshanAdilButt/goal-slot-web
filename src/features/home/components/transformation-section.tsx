import { ArrowRight, CheckCircle, XCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function TransformationSection() {
  return (
    <section className="border-b-2 border-secondary bg-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Before vs After GoalSlot
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            This is the difference between hoping and knowing
          </p>
        </AnimatedSection>

        <div className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Before */}
          <AnimatedSection
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-sm border-2 border-secondary bg-white p-6 shadow-brutal lg:col-span-2"
          >
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 rounded border-2 border-secondary bg-red-500 px-3 py-1 font-display text-xs font-bold uppercase text-white shadow-brutal-sm">
                Before
              </span>
            </div>

            {/* Visual: Scattered elements */}
            <div className="bg-grid relative mb-6 flex min-h-[120px] items-center justify-center rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="absolute left-4 top-4 h-8 w-12 -rotate-12 rounded-sm border border-gray-400 bg-gray-200"></div>
              <div className="absolute right-6 top-6 h-8 w-12 rotate-6 rounded-sm border border-gray-400 bg-gray-200"></div>
              <div className="absolute bottom-4 left-8 h-8 w-12 rotate-12 rounded-sm border border-gray-400 bg-gray-200"></div>
              <p className="z-10 font-mono text-xs font-bold text-gray-400">???</p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"I set a goal 6 months ago... did I work on it?"</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"No idea how many hours I coded this month"</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"Another year passed. Where did my time go?"</span>
              </li>
            </ul>
          </AnimatedSection>

          {/* Arrow */}
          <div className="hidden items-center justify-center lg:flex">
            <AnimatedSection
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex h-16 w-16 items-center justify-center rounded-sm border-2 border-secondary bg-primary shadow-brutal"
            >
              <ArrowRight className="h-8 w-8" />
            </AnimatedSection>
          </div>

          {/* After */}
          <AnimatedSection
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-sm border-2 border-secondary bg-green-500 p-6 text-white shadow-brutal lg:col-span-2"
          >
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 rounded border-2 border-white bg-white px-3 py-1 font-display text-xs font-bold uppercase text-green-600 shadow-[2px_2px_0px_0px_white]">
                After
              </span>
            </div>

            {/* Visual: Organized progress bars */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 flex-1 overflow-hidden rounded-sm border border-white bg-green-400">
                  <div className="h-full w-4/5 bg-white"></div>
                </div>
                <span className="font-mono text-xs font-bold">87%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 flex-1 overflow-hidden rounded-sm border border-white bg-green-400">
                  <div className="h-full w-3/5 bg-white"></div>
                </div>
                <span className="font-mono text-xs font-bold">64%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 flex-1 overflow-hidden rounded-sm border border-white bg-green-400">
                  <div className="h-full w-full bg-white"></div>
                </div>
                <span className="font-mono text-xs font-bold">100%</span>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"127 hours on React. My goal is 80% complete."</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"Last month: 42h coded. This month: 38h with a week left."</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"I show my mentor exactly where my time went. No guessing."</span>
              </li>
            </ul>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
