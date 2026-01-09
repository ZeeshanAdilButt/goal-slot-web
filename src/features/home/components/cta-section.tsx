import Link from 'next/link'

import { ArrowRight, CheckCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function CTASection() {
  return (
    <section className="bg-secondary px-4 py-12 text-white sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <AnimatedSection
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Emotional Hook */}
          <p className="mb-4 font-mono text-lg text-primary">Feeling doesn't equal doing. Proof does.</p>

          <h2 className="mb-6 font-display text-4xl font-bold uppercase md:text-6xl">Your Growth, Measured.</h2>

          <p className="mx-auto mb-4 max-w-2xl font-mono text-xl text-gray-300">
            365 days. 2,000+ hours to invest. Where will yours go?
          </p>

          {/* The Stakes */}
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border-2 border-primary/50 bg-primary/10 p-4">
            <p className="font-mono text-lg text-gray-200">
              <span className="font-bold text-primary">The 10,000-hour rule is real.</span> But you can't count what you don't track.
            </p>
            <p className="mt-4 font-mono text-gray-300">
              Every hour logged is a brick in your foundation. Start stacking.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="btn-brutal flex animate-pulse items-center gap-2 px-8 py-4 text-xl hover:animate-none"
            >
              Start Free – Takes 30 Seconds <ArrowRight className="h-6 w-6" />
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2 font-mono text-sm">
              <CheckCircle className="h-4 w-4 text-accent-green" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <CheckCircle className="h-4 w-4 text-accent-green" />
              Free forever for basics
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <CheckCircle className="h-4 w-4 text-accent-green" />
              30-day money-back guarantee
            </div>
          </div>

          {/* Social Proof Reminder */}
          <p className="mt-8 font-mono text-sm text-gray-500">
            500+ developers already tracking their growth.
          </p>

          {/* Final Micro-Copy */}
          <p className="mt-4 font-display text-2xl font-bold text-primary">
            Stack your hours. Prove your progress.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
