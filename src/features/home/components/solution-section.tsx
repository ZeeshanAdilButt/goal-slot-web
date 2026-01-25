import { BarChart3, Calendar, CheckCircle, Clock, Target, XCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function SolutionSection() {
  return (
    <section className="border-b-2 border-secondary bg-background px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Stop Paying for Scattered Tools
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            You're spending $25+/month on apps that don't talk to each other
          </p>
        </AnimatedSection>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Fragmented Tools */}
          <AnimatedSection
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-sm border-2 border-secondary bg-white p-8 shadow-brutal"
          >
            <div className="mb-6 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              <span className="font-display text-xl font-bold">The Fragmented Way</span>
            </div>

            {/* Visual representation of scattered tools */}
            <div className="bg-grid relative mb-6 flex min-h-[200px] items-center justify-center rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="absolute left-8 top-8 -rotate-6 rounded-sm border-2 border-red-400 bg-red-100 px-3 py-2">
                <p className="text-xs font-bold">Toggl</p>
              </div>
              <div className="absolute right-10 top-12 rotate-12 rounded-sm border-2 border-blue-400 bg-blue-100 px-3 py-2">
                <p className="text-xs font-bold">Notion</p>
              </div>
              <div className="absolute bottom-12 left-12 rotate-3 rounded-sm border-2 border-purple-400 bg-purple-100 px-3 py-2">
                <p className="text-xs font-bold">Todoist</p>
              </div>
              <div className="absolute bottom-8 right-8 -rotate-6 rounded-sm border-2 border-orange-400 bg-orange-100 px-3 py-2">
                <p className="text-xs font-bold">Calendar</p>
              </div>
              <p className="z-10 font-display text-lg font-bold text-gray-400">DISCONNECTED</p>
            </div>

            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <span>Toggl tracks time, but doesn't know your goals</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <span>Notion stores goals, but can't schedule or track them</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <span>Calendar shows blocks, but no link to actual work</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <span>Nothing connects → You abandon all of them</span>
              </li>
            </ul>

            <div className="rounded-sm border-2 border-red-200 bg-red-50 p-4">
              <p className="font-mono text-2xl font-black text-red-600">$25+/month</p>
              <p className="text-sm text-gray-600">for disconnected chaos</p>
            </div>
          </AnimatedSection>

          {/* Unified System */}
          <AnimatedSection
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-sm border-2 border-secondary bg-green-500 p-8 text-white shadow-brutal"
          >
            <div className="mb-6 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              <span className="font-display text-xl font-bold">The GoalSlot Way</span>
            </div>

            {/* Visual representation of unified system */}
            <div className="bg-grid relative mb-6 flex min-h-[200px] items-center justify-center rounded-sm border-2 border-white bg-green-400 p-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-white bg-white shadow-[2px_2px_0px_0px_white]">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="h-0.5 w-4 bg-white"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-white bg-white shadow-[2px_2px_0px_0px_white]">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="h-0.5 w-4 bg-white"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-white bg-white shadow-[2px_2px_0px_0px_white]">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="h-0.5 w-4 bg-white"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-white bg-white shadow-[2px_2px_0px_0px_white]">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span><strong>Goals</strong> automatically link to schedule blocks</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span><strong>Timer</strong> tracks work sessions toward each goal</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span><strong>Reports</strong> show where every hour went</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Everything syncs → You actually stick with it</span>
              </li>
            </ul>

            <div className="rounded-sm border-2 border-white bg-white p-4 text-green-600">
              <p className="font-mono text-2xl font-black">$7/month</p>
              <p className="text-sm text-gray-700">for the complete unified system</p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
