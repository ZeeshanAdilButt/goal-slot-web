import Link from 'next/link'

import { ArrowRight, Calendar, Code } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function HeroSection() {
  return (
    <section className="relative w-full border-b-2 border-secondary bg-grid">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left Column - Copy */}
          <AnimatedSection
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            {/* Headline */}
            <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Track your goals.
              <br />
              <span className="text-gray-500">See where your time goes.</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-lg text-lg leading-relaxed text-gray-600">
              GoalSlot connects your goals to your calendar and tracks every hour you work on them. 
              Finally know if you're actually making progress.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group flex h-12 items-center justify-center gap-2 rounded-sm border-2 border-secondary bg-primary px-6 text-sm font-bold uppercase tracking-wide shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="flex h-12 items-center justify-center gap-2 rounded-sm border-2 border-secondary bg-white px-6 text-sm font-bold uppercase tracking-wide shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                See Features
              </Link>
            </div>

            {/* Simple note */}
            <p className="text-sm text-gray-500">
              Free plan available. Join 100+ users tracking their goals.
            </p>
          </AnimatedSection>

          {/* Right Column - Visual */}
          <AnimatedSection
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full"
          >
            <div className="relative flex min-h-[380px] w-full items-center justify-center">
              {/* Background accent box */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-sm border-2 border-secondary bg-primary/20"></div>

              {/* Main content card */}
              <div className="relative flex w-full flex-col overflow-hidden rounded-sm border-2 border-secondary bg-white shadow-brutal">
                {/* Mock Window Header */}
                <div className="flex h-8 items-center gap-2 border-b-2 border-secondary bg-gray-100 px-3">
                  <div className="h-3 w-3 rounded-full border border-secondary bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full border border-secondary bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full border border-secondary bg-green-400"></div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="flex flex-1 flex-col gap-4 bg-white p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Today
                      </p>
                      <h3 className="font-display text-base font-bold">Monday, Jan 27</h3>
                    </div>
                    <span className="rounded-sm border-2 border-secondary bg-secondary px-3 py-1 font-mono text-xs font-bold text-white">
                      4h 20m
                    </span>
                  </div>

                  {/* Grid Layout */}
                  <div className="grid h-full grid-cols-12 gap-3">
                    {/* Left: Goals */}
                    <div className="col-span-5 flex flex-col gap-2 border-r border-gray-100 pr-3">
                      <p className="text-xs font-bold uppercase text-gray-400">Goals</p>
                      <div className="rounded-sm border-2 border-secondary bg-primary p-2.5">
                        <p className="text-xs font-bold">Launch MVP</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/20">
                          <div className="h-full w-2/3 bg-secondary"></div>
                        </div>
                      </div>
                      <div className="rounded-sm border border-gray-200 bg-gray-50 p-2.5 opacity-60">
                        <p className="text-xs font-bold text-gray-600">Learn React</p>
                      </div>
                    </div>

                    {/* Right: Time Blocks */}
                    <div className="col-span-7 flex flex-col gap-2">
                      <p className="text-xs font-bold uppercase text-gray-400">Schedule</p>
                      <div className="flex items-center rounded-sm border-2 border-secondary bg-white p-2.5 shadow-brutal-sm">
                        <Code className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <p className="text-xs font-bold">Frontend Work</p>
                          <p className="text-[10px] text-gray-500">10:00 - 12:00</p>
                        </div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                      </div>

                      <div className="flex items-center rounded-sm border border-dashed border-gray-300 bg-gray-50 p-2.5">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <p className="text-xs text-gray-400">Available slot</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
