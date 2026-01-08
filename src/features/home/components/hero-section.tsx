import Link from 'next/link'

import { ArrowRight, ChevronRight, Sparkles, Star } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

import { GoalAchievementSVG } from './svg-illustrations'

export function HeroSection() {
  return (
    <section className="px-4 pb-12 pt-24 sm:px-6 sm:pb-20 sm:pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <AnimatedSection
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Urgency Badge */}
            <div className="mb-6 inline-flex items-center gap-2 border-3 border-secondary bg-accent-pink px-4 py-2 text-white shadow-brutal-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-bold uppercase">Make 2026 Your Year</span>
            </div>

            <h1 className="mb-6 font-display text-5xl font-bold uppercase leading-tight md:text-6xl lg:text-7xl">
              Your Growth,<span className="block text-primary drop-shadow-[4px_4px_0px_#000]">Measured.</span>
            </h1>

            <p className="mb-8 max-w-lg font-mono text-xl text-gray-700">
              Track hours toward mastery. <strong>Proof over feeling.</strong> See exactly where your time goes — and watch your skills stack up.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="btn-brutal flex items-center gap-2 text-lg">
                  Start Free Today <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="#problem" className="btn-brutal-secondary flex items-center gap-2">
                  See How It Works <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <p className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Free for individual developers
              </p>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[
                  'from-accent-pink to-accent-purple',
                  'from-accent-blue to-accent-green',
                  'from-primary to-accent-orange',
                  'from-accent-purple to-accent-blue',
                  'from-accent-green to-primary',
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-full border-3 border-secondary bg-gradient-to-br ${gradient}`}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="font-mono text-sm">500+ developers tracking their growth</span>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Goal Achievement Illustration */}
            <div className="card-brutal overflow-hidden bg-white">
              <GoalAchievementSVG />
              <div className="mt-4 text-center">
                <p className="font-display text-xl font-bold uppercase">Your Goals. Tracked. Achieved.</p>
              </div>
            </div>
            
            <div className="mt-2 text-center">
              <p className="font-mono text-sm font-bold text-gray-800">
                Every hour logged is proof of progress.
              </p>
            </div>

            {/* Floating Stats */}
            <AnimatedSection
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: 'Infinity' }}
              className="absolute -right-4 top-4 border-3 border-secondary bg-accent-purple p-4 text-white shadow-brutal"
            >
              <div className="font-mono text-2xl font-bold">87%</div>
              <div className="text-xs font-bold uppercase">Goals Hit</div>
            </AnimatedSection>

            <AnimatedSection
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: 'Infinity' }}
              className="absolute -left-4 bottom-8 border-3 border-secondary bg-accent-blue p-4 text-white shadow-brutal"
            >
              <div className="font-mono text-2xl font-bold">142h</div>
              <div className="text-xs font-bold uppercase">Tracked</div>
            </AnimatedSection>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
