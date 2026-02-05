import { BarChart3, Calendar, CheckSquare, Clock, Target } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function PhilosophySection() {
  return (
    <section
      id="logic"
      className="border-y-3 border-secondary bg-secondary px-4 py-12 text-white sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-5xl text-center">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-8 inline-flex items-center gap-2 border-3 border-white bg-primary px-4 py-2 text-secondary shadow-brutal-sm">
            <CheckSquare className="h-5 w-5" />
            <span className="font-bold uppercase">The Logic</span>
          </div>

          <h2 className="mb-8 font-display text-4xl font-bold uppercase md:text-5xl">
            The Logic: <span className="bg-primary px-2 text-secondary">4 Steps</span> to Mastery
          </h2>

          <p className="mb-12 text-lg text-gray-300">
            Most people fail because they skip steps. Goals without schedules are wishes. Time
            tracking without goals is busywork. GoalSlot forces the complete loop—from ambition to
            execution to proof.
          </p>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="border-3 border-white bg-secondary/50 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-white bg-primary px-2 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 01</span>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-white bg-primary mx-auto">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold uppercase">Goals</h3>
              <p className="font-mono text-xs text-gray-300">
                Define outcomes with deadlines. Visualize all goals in one board.
              </p>
            </div>

            <div className="border-3 border-white bg-secondary/50 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-white bg-primary px-2 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 02</span>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-white bg-green-500 mx-auto">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold uppercase">Schedule</h3>
              <p className="font-mono text-xs text-gray-300">
                Allocate weekly blocks. Turn ambition into tangible time commitment.
              </p>
            </div>

            <div className="border-3 border-white bg-secondary/50 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-white bg-primary px-2 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 03</span>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-white bg-blue-500 mx-auto">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold uppercase">Timer</h3>
              <p className="font-mono text-xs text-gray-300">
                Execute with live tracking. Log every minute toward your goals.
              </p>
            </div>

            <div className="border-3 border-white bg-secondary/50 p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-white bg-primary px-2 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 04</span>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-white bg-purple-500 mx-auto">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold uppercase">Reports</h3>
              <p className="font-mono text-xs text-gray-300">
                Review dashboards. See where every hour went. Data = accountability.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-sm border-2 border-white bg-primary p-6">
            <p className="font-display text-xl font-black text-secondary">
              "What gets scheduled gets done. What gets tracked gets finished."
            </p>
            <p className="mt-2 text-sm font-bold text-secondary/80">— The GoalSlot Philosophy</p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
