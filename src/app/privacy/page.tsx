'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import { ArrowLeft, Shield } from 'lucide-react'

import { GoalSlotBrand } from '@/components/goalslot-logo'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brutalist-bg">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b-3 border-secondary bg-brutalist-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/">
            <GoalSlotBrand size="md" tagline="Your growth, measured." />
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-brutal-secondary px-4 py-2 text-sm">
              Login
            </Link>
            <Link href="/signup" className="btn-brutal px-4 py-2 text-sm">
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
            <div className="card-brutal mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border-3 border-secondary bg-accent-blue shadow-brutal">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold uppercase md:text-5xl">Privacy Policy</h1>
                  <p className="font-mono text-sm text-gray-600">Last updated: December 25, 2025</p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">1. Introduction</h2>
                <p className="font-mono text-gray-700">
                  Welcome to GoalSlot. We respect your privacy and are committed to protecting your personal data. This
                  privacy policy explains how we collect, use, and safeguard your information when you use our
                  productivity tracking application.
                </p>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">2. Information We Collect</h2>
                <div className="space-y-4 font-mono text-gray-700">
                  <p>We collect information that you provide directly to us, including:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      <strong>Account Information:</strong> Email address, name, and authentication data when you create
                      an account
                    </li>
                    <li>
                      <strong>Profile Data:</strong> Any profile information you choose to add
                    </li>
                    <li>
                      <strong>Time Tracking Data:</strong> Goals, tasks, time entries, schedules, and productivity
                      metrics you log
                    </li>
                    <li>
                      <strong>Usage Data:</strong> How you interact with our application features
                    </li>
                  </ul>
                </div>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">3. How We Use Your Information</h2>
                <div className="space-y-4 font-mono text-gray-700">
                  <p>We use your information to:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Generate productivity reports and analytics for your personal use</li>
                    <li>Send you important updates about your account and our services</li>
                    <li>Enable sharing features when you choose to share your progress</li>
                    <li>Respond to your requests and provide customer support</li>
                  </ul>
                </div>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">4. Data Security</h2>
                <p className="font-mono text-gray-700">
                  We implement appropriate technical and organizational security measures to protect your personal data
                  against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted both in
                  transit and at rest. However, no method of transmission over the Internet is 100% secure, and we
                  cannot guarantee absolute security.
                </p>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">5. Data Sharing</h2>
                <div className="space-y-4 font-mono text-gray-700">
                  <p>We do not sell your personal data. We may share your information only in these circumstances:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      <strong>With Your Consent:</strong> When you explicitly choose to share your data (e.g., sharing
                      reports with mentors)
                    </li>
                    <li>
                      <strong>Service Providers:</strong> With trusted third-party services that help us operate our
                      platform
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law or to protect our rights
                    </li>
                  </ul>
                </div>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">6. Your Rights</h2>
                <div className="space-y-4 font-mono text-gray-700">
                  <p>You have the right to:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt-out of marketing communications</li>
                  </ul>
                </div>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">7. Cookies & Tracking</h2>
                <p className="font-mono text-gray-700">
                  We use essential cookies to maintain your session and preferences. We do not use third-party tracking
                  cookies for advertising purposes. Analytics data is collected in aggregate to improve our services.
                </p>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">8. Children's Privacy</h2>
                <p className="font-mono text-gray-700">
                  Our service is not directed to children under 13. We do not knowingly collect personal information
                  from children under 13. If you believe we have collected data from a child, please contact us
                  immediately.
                </p>
              </section>

              <section className="card-brutal">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">9. Changes to This Policy</h2>
                <p className="font-mono text-gray-700">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the
                  new privacy policy on this page and updating the "Last updated" date. We encourage you to review this
                  policy periodically.
                </p>
              </section>

              <section className="card-brutal border-l-8 border-l-primary">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">10. Contact Us</h2>
                <p className="font-mono text-gray-700">
                  If you have any questions about this privacy policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 inline-block border-3 border-secondary bg-gray-100 px-4 py-2">
                  <a
                    href="mailto:privacy@goalslot.com"
                    className="font-mono font-bold transition-colors hover:text-primary"
                  >
                    privacy@goalslot.com
                  </a>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-secondary px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <GoalSlotBrand size="sm" showTagline={false} />

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="font-mono text-sm font-bold text-primary">
                Privacy
              </Link>
              <Link href="/faq" className="font-mono text-sm transition-colors hover:text-primary">
                FAQ
              </Link>
              <a href="#" className="font-mono text-sm transition-colors hover:text-primary">
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
