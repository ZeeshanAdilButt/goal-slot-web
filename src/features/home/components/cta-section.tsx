import Link from 'next/link'

import { ArrowRight, CheckCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

export function CTASection() {
  return (
    <section className="bg-secondary px-6 py-24 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <AnimatedSection
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Emotional Hook */}
          <p className="mb-4 font-mono text-lg text-primary">You've read this far because something needs to change.</p>

          <h2 className="mb-6 font-display text-4xl font-bold uppercase md:text-6xl">Stop Dreaming. Start Tracking.</h2>

          <p className="mx-auto mb-4 max-w-2xl font-mono text-xl text-gray-300">
            A year from now, you'll wish you started today.
          </p>

          {/* The Stakes */}
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border-2 border-primary/50 bg-primary/10 p-6">
            <p className="font-mono text-lg text-gray-200">
              <span className="font-bold text-primary">Here's the truth:</span> You already know how to set goals. The
              problem is you don't have a system to prove you're working on them.
            </p>
            <p className="mt-4 font-mono text-gray-300">
              Every day without tracking is a day you can't get back. Every hour unlogged is an hour you can't prove
              happened.
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
            Join 500+ developers who stopped guessing and started tracking.
          </p>

          {/* Final Micro-Copy */}
          <p className="mt-4 font-display text-2xl font-bold text-primary">
            Your future self is counting on you. Make them proud.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
