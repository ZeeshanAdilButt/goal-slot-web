import { AnimatedSection } from '@/components/animated-section'

export function VisualShowcaseSection() {
  return (
    <section className="w-full border-b-2 border-secondary bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Step 1: Define The Goal Board */}
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-secondary bg-primary px-3 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 01</span>
              </div>
              <h2 className="mb-4 font-display text-4xl font-black">Define The Goal Board</h2>
              <p className="mb-6 text-lg text-gray-700">
                Organize quarterly objectives, active projects, and backlog items. Link goals to
                categories, set deadlines, and track progress with visual progress bars.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Create unlimited goals with deadlines and categories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Visual progress tracking based on logged time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Break down goals into actionable tasks</span>
                </li>
              </ul>
            </div>

            {/* Visual Mockup */}
            <div className="rounded-sm border-2 border-secondary bg-white p-6 shadow-brutal">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase text-gray-500">
                  QUARTERLY GOALS
                </h3>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-bold">
                  Q1 2026
                </span>
              </div>
              <div className="space-y-3">
                {/* Goal 1 */}
                <div className="rounded-sm border border-yellow-200 bg-yellow-50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-yellow-800">ACTIVE</p>
                      <p className="font-display text-sm font-bold">Launch MVP</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-yellow-800">67%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-yellow-200">
                    <div className="h-full w-2/3 bg-yellow-500"></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">142h logged • Due Mar 15</p>
                </div>

                {/* Goal 2 */}
                <div className="rounded-sm border border-green-200 bg-green-50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-green-800">LEARNING</p>
                      <p className="font-display text-sm font-bold">Master React Native</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-green-800">34%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-green-200">
                    <div className="h-full w-1/3 bg-green-500"></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">51h logged • Due Apr 30</p>
                </div>

                {/* Goal 3 */}
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 opacity-50">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-600">BACKLOG</p>
                      <p className="font-display text-sm font-bold">Portfolio Redesign</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-600">0%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-0 bg-gray-400"></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Not started • Due Jun 1</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Step 2: Allocate The Schedule */}
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual Mockup */}
            <div className="order-2 rounded-sm border-2 border-secondary bg-white p-6 shadow-brutal lg:order-1">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase text-gray-500">
                  WEEKLY SCHEDULE
                </h3>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-bold">
                  Week 4
                </span>
              </div>
              <div className="space-y-2">
                {/* Monday */}
                <div>
                  <p className="mb-1 text-xs font-bold text-gray-400">MON</p>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 rounded-sm border-2 border-secondary bg-primary p-2">
                      <p className="text-xs font-bold">Deep Work</p>
                      <p className="text-xs opacity-70">9-11am</p>
                    </div>
                    <div className="col-span-3 rounded-sm border border-green-400 bg-green-100 p-2">
                      <p className="text-xs font-bold">Learning</p>
                      <p className="text-xs opacity-70">2-3:30pm</p>
                    </div>
                  </div>
                </div>

                {/* Tuesday */}
                <div>
                  <p className="mb-1 text-xs font-bold text-gray-400">TUE</p>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-5 rounded-sm border-2 border-secondary bg-primary p-2">
                      <p className="text-xs font-bold">Deep Work</p>
                      <p className="text-xs opacity-70">9-11:30am</p>
                    </div>
                    <div className="col-span-2 rounded-sm border border-orange-400 bg-orange-100 p-2">
                      <p className="text-xs font-bold">Exercise</p>
                      <p className="text-xs opacity-70">6-7pm</p>
                    </div>
                  </div>
                </div>

                {/* Wednesday */}
                <div>
                  <p className="mb-1 text-xs font-bold text-gray-400">WED</p>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 rounded-sm border-2 border-secondary bg-primary p-2">
                      <p className="text-xs font-bold">Deep Work</p>
                      <p className="text-xs opacity-70">9-11am</p>
                    </div>
                    <div className="col-span-4 rounded-sm border border-pink-400 bg-pink-100 p-2">
                      <p className="text-xs font-bold">Side Project</p>
                      <p className="text-xs opacity-70">7-9pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-secondary bg-primary px-3 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 02</span>
              </div>
              <h2 className="mb-4 font-display text-4xl font-black">Allocate The Schedule</h2>
              <p className="mb-6 text-lg text-gray-700">
                Transform ambition into recurring calendar blocks. Deep Work, Learning, DSA,
                Exercise—schedule what matters and see your week at a glance.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Create recurring weekly time blocks for each goal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Color-coded categories (Deep Work, Learning, Exercise, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Visual weekly view shows where ambition meets execution</span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* Step 3: Execute The Timer */}
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-secondary bg-primary px-3 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 03</span>
              </div>
              <h2 className="mb-4 font-display text-4xl font-black">Execute The Timer</h2>
              <p className="mb-6 text-lg text-gray-700">
                Enter flow state. Start the timer, link it to your goal, and log every minute.
                Manual entries work too. What matters is the truth: did you show up?
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>One-click timer that auto-links to active goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Manual time entry for retrospective logging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Live timer shows current session and daily total</span>
                </li>
              </ul>
            </div>

            {/* Visual Mockup - Timer */}
            <div className="rounded-sm border-2 border-secondary bg-gray-900 p-8 shadow-brutal">
              <div className="mb-6 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  WORKING ON: Deep Work (Frontend Architecture)
                </p>
                <div className="font-mono text-6xl font-black text-primary">24:59</div>
              </div>

              <div className="mb-6 flex items-center justify-center gap-4">
                <button className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-white shadow-brutal">
                  <div className="h-0 w-0 border-y-8 border-l-12 border-y-transparent border-l-gray-900"></div>
                </button>
                <button className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-brutal">
                  <div className="h-6 w-6 rounded-sm bg-white"></div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-xs text-gray-400">
                <div className="text-center">
                  <p className="mb-1 font-bold">SESSIONS</p>
                  <p className="font-mono text-xl text-white">3</p>
                </div>
                <div className="h-8 w-px bg-gray-700"></div>
                <div className="text-center">
                  <p className="mb-1 font-bold">TODAY</p>
                  <p className="font-mono text-xl text-white">4h 12m</p>
                </div>
                <div className="h-8 w-px bg-gray-700"></div>
                <div className="text-center">
                  <p className="mb-1 font-bold">THIS WEEK</p>
                  <p className="font-mono text-xl text-white">23h 45m</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Step 4: Reflect The Reports */}
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual Mockup */}
            <div className="order-2 rounded-sm border-2 border-secondary bg-white p-6 shadow-brutal lg:order-1">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase text-gray-500">
                  WEEKLY ANALYTICS
                </h3>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-bold">
                  Jan 20-26
                </span>
              </div>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-bold text-gray-500">TOTAL HOURS</p>
                  <p className="font-mono text-3xl font-black">42.5h</p>
                </div>
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-bold text-gray-500">COMPLETION RATE</p>
                  <p className="font-mono text-3xl font-black">94%</p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mb-2 flex items-end gap-2">
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '60px' }}></div>
                  <p className="text-xs font-bold text-gray-400">M</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '80px' }}></div>
                  <p className="text-xs font-bold text-gray-400">T</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '100px' }}></div>
                  <p className="text-xs font-bold text-gray-400">W</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '70px' }}></div>
                  <p className="text-xs font-bold text-gray-400">T</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '90px' }}></div>
                  <p className="text-xs font-bold text-gray-400">F</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '50px' }}></div>
                  <p className="text-xs font-bold text-gray-400">S</p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="mb-2 w-full rounded-t-sm border-2 border-secondary bg-primary shadow-brutal-sm" style={{ height: '40px' }}></div>
                  <p className="text-xs font-bold text-gray-400">S</p>
                </div>
              </div>

              <p className="text-center text-xs text-gray-500">Daily hours logged this week</p>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded border-2 border-secondary bg-primary px-3 py-1">
                <span className="font-mono text-xs font-bold text-secondary">STEP 04</span>
              </div>
              <h2 className="mb-4 font-display text-4xl font-black">Review The Reports</h2>
              <p className="mb-6 text-lg text-gray-700">
                Weekly dashboards reveal the truth: where every hour went, which goals got
                attention, and what you actually accomplished. Data makes excuses impossible.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Daily/weekly/monthly analytics by goal and category</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Completion rates show if you're hitting your scheduled blocks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                  <span>Share reports with mentors and accountability partners</span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
