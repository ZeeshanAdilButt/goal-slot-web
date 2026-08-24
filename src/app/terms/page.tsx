'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import { ArrowLeft, Scale } from 'lucide-react'

import { GoalSlotBrand } from '@/components/goalslot-logo'

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/">
            <GoalSlotBrand size="md" tagline="Your growth, measured." />
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50">
              Login
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 pb-12 pt-24 sm:px-6 sm:pb-20 sm:pt-28 md:pt-32">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Back Link */}
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 font-mono text-sm font-bold uppercase transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            {/* Header */}
            <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border border-zinc-200 bg-sky-100 shadow-sm">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold uppercase md:text-5xl">Terms of Use</h1>
                  <p className="font-mono text-sm text-gray-600">Last updated: August 8, 2026</p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">1. Acceptance of These Terms</h2>
                <p className="font-mono text-gray-700">
                  These Terms of Use govern your access to and use of GoalSlot, available at goalslot.io and through our
                  mobile applications (the &quot;Service&quot;). By creating an account or using the Service, you agree
                  to these terms. If you do not agree, please do not use the Service.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">2. The Service</h2>
                <p className="font-mono text-gray-700">
                  GoalSlot is a productivity tool for setting goals, scheduling work, tracking time, and keeping notes
                  and journals. We may add, change, or remove features over time. We aim to give reasonable notice of
                  material changes, but we may make changes without notice where necessary for security, legal
                  compliance, or the stability of the Service.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">3. Your Account</h2>
                <p className="font-mono text-gray-700">
                  You must provide accurate information when creating an account and keep your credentials secure. You
                  are responsible for activity that occurs under your account. You must be at least 13 years old to use
                  the Service. Notify us promptly if you believe your account has been compromised.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">4. Your Content</h2>
                <p className="font-mono text-gray-700">
                  You retain ownership of the goals, tasks, notes, journals, and other content you create in the Service
                  (&quot;Your Content&quot;). You grant us a limited licence to store, process, and display Your Content
                  solely to operate and improve the Service for you &mdash; for example, to sync it across your devices,
                  to share it with people you explicitly share it with, or to process it through features you choose to
                  use. We do not sell Your Content. Our handling of personal data is described in our{' '}
                  <Link href="/privacy" className="font-bold transition-colors hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">5. Acceptable Use</h2>
                <p className="font-mono text-gray-700">You agree not to:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6 font-mono text-gray-700">
                  <li>Use the Service to store or distribute unlawful, infringing, or harmful content</li>
                  <li>Attempt to access other users&apos; accounts or data</li>
                  <li>Probe, scan, or test the vulnerability of the Service, or bypass its security or rate limits</li>
                  <li>Interfere with or disrupt the Service, its infrastructure, or other users&apos; use of it</li>
                  <li>Resell or redistribute the Service without our written permission</li>
                  <li>Use automated means to extract data from the Service beyond documented APIs</li>
                </ul>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">6. Third-Party Integrations</h2>
                <p className="font-mono text-gray-700">
                  The Service can connect to third-party products you authorise, such as Notion, Google Calendar, or AI
                  providers where you supply your own API key. When you connect one, you authorise us to access and
                  exchange the data needed for that integration to work, limited to the scope you approve at the time of
                  connection. Those third parties are governed by their own terms and privacy policies, and we are not
                  responsible for their services or how they handle data once it reaches them. You can disconnect an
                  integration at any time from your settings.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">7. Plans, Billing, and Refunds</h2>
                <p className="font-mono text-gray-700">
                  Paid plans are billed in advance on a recurring basis through our payment processor. Subscriptions
                  renew automatically until cancelled. You can cancel at any time, and cancellation takes effect at the
                  end of the current billing period &mdash; we do not provide pro-rated refunds for partial periods
                  except where required by law. We may change pricing with reasonable advance notice, which will not
                  affect a billing period already paid for.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">8. Availability and Data</h2>
                <p className="font-mono text-gray-700">
                  We work to keep the Service available and your data safe, but we do not guarantee uninterrupted or
                  error-free operation. We recommend keeping your own copies of anything critical. Where the Service
                  offers export, you may export Your Content at any time.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">9. Termination</h2>
                <p className="font-mono text-gray-700">
                  You may stop using the Service and delete your account at any time. We may suspend or terminate access
                  if you materially breach these terms, if required by law, or to protect the Service or its users.
                  Where practical we will give notice and an opportunity to correct the problem first. On termination,
                  we will delete or anonymise Your Content in line with our Privacy Policy.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">10. Disclaimers</h2>
                <p className="font-mono text-gray-700">
                  The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                  whether express or implied, to the fullest extent permitted by law. Any coaching, insights, or
                  suggestions generated by the Service &mdash; including AI-generated content &mdash; are informational
                  only and are not professional advice. You are responsible for decisions you make based on them.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">11. Limitation of Liability</h2>
                <p className="font-mono text-gray-700">
                  To the fullest extent permitted by law, GoalSlot will not be liable for indirect, incidental, special,
                  consequential, or punitive damages, or for lost profits, revenue, or data. Our total liability arising
                  out of or relating to the Service is limited to the amount you paid us in the twelve months before the
                  event giving rise to the claim. Some jurisdictions do not allow these limitations, in which case they
                  apply to the extent permitted.
                </p>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">12. Changes to These Terms</h2>
                <p className="font-mono text-gray-700">
                  We may update these terms from time to time. We will post the updated terms on this page and update
                  the &quot;Last updated&quot; date. Material changes will be communicated where reasonably possible.
                  Continuing to use the Service after changes take effect means you accept the updated terms.
                </p>
              </section>

              <section className="rounded-xl border border-l-8 border-zinc-200 border-l-primary bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">13. Contact Us</h2>
                <p className="font-mono text-gray-700">
                  If you have any questions about these terms, please contact us at:
                </p>
                <div className="mt-4 inline-block border border-zinc-200 bg-gray-100 px-4 py-2">
                  <a
                    href="mailto:support@goalslot.io"
                    className="font-mono font-bold transition-colors hover:text-primary"
                  >
                    support@goalslot.io
                  </a>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <GoalSlotBrand size="sm" showTagline={false} />

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="font-mono text-sm transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="font-mono text-sm font-bold text-primary">
                Terms
              </Link>
              <Link href="/faq" className="font-mono text-sm transition-colors hover:text-primary">
                FAQ
              </Link>
              <a
                href="mailto:support@goalslot.io"
                className="font-mono text-sm transition-colors hover:text-primary"
              >
                Support
              </a>
            </div>

            <p className="font-mono text-sm text-gray-600">© 2026 GoalSlot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
