import Link from 'next/link'

import { ArrowRight, CheckCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function CTASection() {
  return (
    <section className="bg-primary px-4 py-16 text-secondary sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <AnimatedSection
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-6 font-display text-5xl font-black uppercase md:text-6xl">
            Join the next generation
            <br />
            of builders.
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-xl">
            Start tracking every hour. Build your proof. Ship your ambitions.
          </p>

          {/* CTA Form */}
          <div className="mx-auto mb-6 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email here"
              className="flex-1 rounded-sm border-2 border-secondary px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 rounded-sm border-2 border-secondary bg-secondary px-6 py-3 font-bold uppercase tracking-wide text-white shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Get Started
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              60-day Pro trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Cancel anytime
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
