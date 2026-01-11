import { Flame } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function MathSection() {
  return (
    <section className="border-y-3 border-secondary bg-secondary px-4 py-12 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">The Hard Truth</span>
          </div>

          <h2 className="mb-8 font-display text-4xl font-bold uppercase md:text-5xl">
            Every Untracked Hour Is a Lost Hour
          </h2>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-5xl font-bold text-primary">2,920</div>
              <p className="mt-2 text-gray-300">hours outside work per year</p>
              <p className="mt-1 text-sm text-gray-500">(8h sleep + 8h work = 8h free × 365)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-5xl font-bold text-accent-orange">???</div>
              <p className="mt-2 text-gray-300">hours you actually tracked</p>
              <p className="mt-1 text-sm text-gray-500">(probably close to zero)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-5xl font-bold text-gray-400">$0</div>
              <p className="mt-2 text-gray-300">proof of your growth</p>
              <p className="mt-1 text-sm text-gray-500">(nothing to show for it)</p>
            </div>
          </div>

          <p className="mx-auto max-w-3xl text-xl text-gray-300">
            In 2025, you had <span className="font-semibold text-primary">2,920 hours</span> of potential growth time. How
            many can you prove you used well?
            <span className="mt-4 block font-semibold text-white">Don't let 2026 be another mystery year.</span>
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
