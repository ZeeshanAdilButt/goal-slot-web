import { CheckCircle, XCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

import { FragmentedToolsSVG, UnifiedSystemSVG } from './svg-illustrations'

export function SolutionSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">The Problem With Other Tools</h2>
          <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
            You're paying for apps that don't talk to each other
          </p>
        </AnimatedSection>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Fragmented Tools */}
          <AnimatedSection
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-brutal bg-red-50"
          >
            <div className="mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              <span className="font-display text-xl font-bold uppercase text-red-600">The Old Way</span>
            </div>
            <FragmentedToolsSVG />
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                <XCircle className="h-4 w-4 text-red-500" />
                Toggl for time ($10/mo) + Todoist for tasks ($5/mo)
              </li>
              <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                <XCircle className="h-4 w-4 text-red-500" />
                Notion for goals ($10/mo) + Calendar app
              </li>
              <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                <XCircle className="h-4 w-4 text-red-500" />
                None of them connect = you give up
              </li>
            </ul>
            <div className="mt-4 border-t-2 border-red-200 pt-4">
              <span className="font-mono text-lg font-bold text-red-600">$25+/month</span>
              <span className="font-mono text-sm text-gray-500"> for scattered tools</span>
            </div>
          </AnimatedSection>

          {/* Unified System */}
          <AnimatedSection
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-brutal-colored bg-accent-green"
          >
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-white" />
              <span className="font-display text-xl font-bold uppercase text-white">The GoalSlot Way</span>
            </div>
            <UnifiedSystemSVG />
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 font-mono text-sm text-white">
                <CheckCircle className="h-4 w-4" />
                Goals → Schedule → Time Tracking → Reports
              </li>
              <li className="flex items-center gap-2 font-mono text-sm text-white">
                <CheckCircle className="h-4 w-4" />
                Everything connected, everything in sync
              </li>
              <li className="flex items-center gap-2 font-mono text-sm text-white">
                <CheckCircle className="h-4 w-4" />
                See exactly where your time goes
              </li>
            </ul>
            <div className="mt-4 border-t-2 border-green-400 pt-4">
              <span className="font-mono text-lg font-bold text-white">From $7/month</span>
              <span className="font-mono text-sm text-green-100"> for everything unified</span>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
