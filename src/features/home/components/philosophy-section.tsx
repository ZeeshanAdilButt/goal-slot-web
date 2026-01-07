import { Brain } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function PhilosophySection() {
  return (
    <section className="border-y-3 border-secondary bg-secondary px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <AnimatedSection initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="mb-8 inline-flex items-center gap-2 border-3 border-white bg-primary px-4 py-2 text-secondary shadow-brutal-sm">
            <Brain className="h-5 w-5" />
            <span className="font-bold uppercase">The Science</span>
          </div>

          <h2 className="mb-8 font-display text-4xl font-bold uppercase md:text-5xl">Goals Need a System</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="border-3 border-white p-6">
              <div className="mb-4 font-mono text-5xl font-bold text-primary">1</div>
              <h3 className="mb-2 font-display text-xl font-bold uppercase">Set Goals</h3>
              <p className="font-mono text-gray-300">Define what you want to achieve with clear deadlines</p>
            </div>
            <div className="border-3 border-white p-6">
              <div className="mb-4 font-mono text-5xl font-bold text-primary">2</div>
              <h3 className="mb-2 font-display text-xl font-bold uppercase">Schedule Time</h3>
              <p className="font-mono text-gray-300">Block time in your calendar for each goal</p>
            </div>
            <div className="border-3 border-white p-6">
              <div className="mb-4 font-mono text-5xl font-bold text-primary">3</div>
              <h3 className="mb-2 font-display text-xl font-bold uppercase">Track Progress</h3>
              <p className="font-mono text-gray-300">See your hours add up and goals get closer</p>
            </div>
          </div>

          <p className="mt-8 font-mono text-xl text-gray-300">
            "You can't achieve what you can't see. You can't see what you don't track."
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
