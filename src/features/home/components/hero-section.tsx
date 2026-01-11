import Link from 'next/link'

import { ArrowRight, ChevronRight, Star } from 'lucide-react'

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
                60-day Pro trial free for all new users
              </p>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-4 rounded-lg border-2 border-gray-200 bg-white/60 px-4 py-3 backdrop-blur-sm">
              <div className="flex -space-x-2">
                {[
                  'bg-gradient-to-br from-blue-400 to-blue-600',
                  'bg-gradient-to-br from-green-400 to-green-600',
                  'bg-gradient-to-br from-purple-400 to-purple-600',
                  'bg-gradient-to-br from-orange-400 to-orange-600',
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-white ${gradient}`}
                  />
                ))}
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-gray-700">4.9</span>
                </div>
                <span className="text-xs text-gray-600">Trusted by 500+ developers</span>
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
                <p className="text-lg font-semibold text-gray-800">Your Goals. Tracked. Achieved.</p>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                Every hour logged is proof of progress.
              </p>
            </div>

            {/* Floating Stats */}
            <AnimatedSection
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-2 top-8 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow-lg sm:-right-4"
            >
              <div className="font-mono text-xl font-bold text-gray-900">87%</div>
              <div className="text-xs font-medium text-gray-500">Goals Achieved</div>
            </AnimatedSection>

            <AnimatedSection
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-2 bottom-12 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow-lg sm:-left-4"
            >
              <div className="font-mono text-xl font-bold text-gray-900">142h</div>
              <div className="text-xs font-medium text-gray-500">Time Tracked</div>
            </AnimatedSection>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
