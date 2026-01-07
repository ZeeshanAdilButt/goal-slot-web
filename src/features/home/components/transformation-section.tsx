import { ArrowRight, CheckCircle, XCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

import { BeforeAfterSVG } from './svg-illustrations'

export function TransformationSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">
            Your Transformation Starts Here
          </h2>
          <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
            This is the difference between hoping and knowing
          </p>
        </AnimatedSection>

        <div className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Before */}
          <AnimatedSection
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-brutal bg-red-50 lg:col-span-2"
          >
            <div className="mb-4 text-center">
              <span className="badge-brutal bg-red-500 text-white">Before</span>
            </div>
            <BeforeAfterSVG type="before" />
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"I set a goal to learn React 6 months ago... I think I watched some tutorials?"</span>
              </li>
              <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"I have no idea how many hours I actually coded this month"</span>
              </li>
              <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>"Another year passed. Where did the time go?"</span>
              </li>
            </ul>
          </AnimatedSection>

          {/* Arrow */}
          <div className="hidden items-center justify-center lg:flex">
            <AnimatedSection
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex h-16 w-16 items-center justify-center border-3 border-secondary bg-primary shadow-brutal"
            >
              <ArrowRight className="h-8 w-8" />
            </AnimatedSection>
          </div>

          {/* After */}
          <AnimatedSection
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-brutal-colored bg-accent-green lg:col-span-2"
          >
            <div className="mb-4 text-center">
              <span className="badge-brutal bg-white text-green-600">After</span>
            </div>
            <BeforeAfterSVG type="after" />
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2 font-mono text-sm text-white">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"I've logged 127 hours on React. My goal is 80% complete."</span>
              </li>
              <li className="flex items-start gap-2 font-mono text-sm text-white">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"Last month I coded 42 hours. This month I'm at 38 with a week left."</span>
              </li>
              <li className="flex items-start gap-2 font-mono text-sm text-white">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>"I can show my mentor exactly where my time went. No guessing."</span>
              </li>
            </ul>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
