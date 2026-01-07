import { Flame } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function MathSection() {
  return (
    <section className="border-y-3 border-secondary bg-secondary px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 border-3 border-white bg-accent-pink px-4 py-2 shadow-brutal-sm">
            <Flame className="h-5 w-5" />
            <span className="font-bold uppercase">The Hard Truth</span>
          </div>

          <h2 className="mb-8 font-display text-4xl font-bold uppercase md:text-5xl">
            Every Untracked Hour Is a Lost Hour
          </h2>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="border-3 border-white p-6">
              <div className="font-mono text-5xl font-bold text-accent-pink">2,920</div>
              <p className="mt-2 font-mono text-gray-300">hours outside work per year</p>
              <p className="mt-1 font-mono text-sm text-gray-400">(8h sleep + 8h work = 8h free × 365)</p>
            </div>
            <div className="border-3 border-white p-6">
              <div className="font-mono text-5xl font-bold text-accent-orange">???</div>
              <p className="mt-2 font-mono text-gray-300">hours you actually tracked</p>
              <p className="mt-1 font-mono text-sm text-gray-400">(probably close to zero)</p>
            </div>
            <div className="border-3 border-white p-6">
              <div className="font-mono text-5xl font-bold text-primary">$0</div>
              <p className="mt-2 font-mono text-gray-300">proof of your growth</p>
              <p className="mt-1 font-mono text-sm text-gray-400">(nothing to show for it)</p>
            </div>
          </div>

          <p className="mx-auto max-w-3xl font-mono text-xl text-gray-300">
            In 2025, you had <span className="font-bold text-primary">2,920 hours</span> of potential growth time. How
            many can you prove you used well?
            <span className="mt-4 block font-bold text-white">Don't let 2026 be another mystery year.</span>
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
