'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brutalist-bg">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b-3 border-secondary bg-brutalist-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-3 border-secondary bg-primary shadow-brutal">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <span className="font-display text-xl font-bold uppercase tracking-tight">Time Master</span>
              <span className="block font-mono text-xs uppercase text-gray-600">Productivity Tracker</span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Features
            </a>
            <a href="#pricing" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Testimonials
            </a>
          </div>

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

      {/* Hero Section */}
      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-6 inline-flex items-center gap-2 border-3 border-secondary bg-primary px-4 py-2 shadow-brutal-sm">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-bold uppercase">Productivity Tracker</span>
              </div>

              <h1 className="mb-6 font-display text-5xl font-bold uppercase leading-tight md:text-7xl">
                Master Your
                <span className="block text-primary drop-shadow-[4px_4px_0px_#000]">Time</span>
                Achieve Your
                <span className="block text-accent-blue drop-shadow-[4px_4px_0px_#000]">Goals</span>
              </h1>

              <p className="mb-8 max-w-lg font-mono text-xl text-gray-700">
                The ultimate productivity tracking tool for mentees and mentors. Track goals, log time, plan schedules,
                and visualize your progress.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="btn-brutal flex items-center gap-2">
                  Start Free <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/login" className="btn-brutal-dark flex items-center gap-2">
                  DW Member Login <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-3 border-secondary bg-gradient-to-br from-primary to-accent-orange"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="font-mono text-sm">500+ Active Users</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Dashboard Preview */}
              <div className="card-brutal overflow-hidden p-0">
                <div className="flex items-center justify-between bg-secondary px-4 py-3 text-white">
                  <span className="text-sm font-bold uppercase">Dashboard Preview</span>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent-pink" />
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div className="h-3 w-3 rounded-full bg-accent-green" />
                  </div>
                </div>
                <div className="bg-brutalist-bg p-6">
                  {/* Mock dashboard content */}
                  <div className="mb-6 grid grid-cols-4 gap-4">
                    {[
                      { label: "Today's Focus", value: '3h 2m', color: 'bg-accent-pink' },
                      { label: 'Weekly Total', value: '4h 2m', color: 'bg-accent-blue' },
                      { label: 'Active Goals', value: '5', color: 'bg-accent-green' },
                      { label: 'Tasks Logged', value: '4', color: 'bg-primary' },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.color} border-3 border-secondary p-3 shadow-brutal-sm`}>
                        <div className="font-mono text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs font-bold uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mock goals */}
                  <div className="space-y-3">
                    {[
                      { title: 'Open Source', category: 'Learning', progress: 0, color: 'border-l-green-500' },
                      { title: '200 DSA', category: 'Work', progress: 1, color: 'border-l-blue-500' },
                      { title: 'Learn React', category: 'Learning', progress: 3, color: 'border-l-blue-500' },
                    ].map((goal, i) => (
                      <div key={i} className={`border-3 border-l-8 border-secondary bg-white p-4 ${goal.color}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-bold uppercase">{goal.title}</span>
                          <span className="badge-brutal bg-gray-100">{goal.category}</span>
                        </div>
                        <div className="progress-brutal">
                          <div className="progress-brutal-fill bg-primary" style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-6 -top-6 flex h-20 w-20 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-lg"
              >
                <Target className="h-10 w-10" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 flex h-16 w-16 items-center justify-center border-3 border-secondary bg-accent-blue shadow-brutal"
              >
                <Clock className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-y-3 border-secondary bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Everything You Need</h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              A complete productivity suite designed for developers and learners
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: 'Goal Tracking',
                description: 'Set SMART goals with deadlines, track progress, and celebrate achievements',
                color: 'bg-accent-green',
              },
              {
                icon: Clock,
                title: 'Time Logging',
                description: 'Log time with a live timer or manual entries. Link to goals for automatic tracking',
                color: 'bg-accent-blue',
              },
              {
                icon: Calendar,
                title: 'Weekly Schedule',
                description: 'Plan your week with time blocks. Visualize your productivity patterns',
                color: 'bg-primary',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                description: 'Beautiful charts and insights. Understand where your time goes',
                color: 'bg-accent-purple',
              },
              {
                icon: Users,
                title: 'Sharing',
                description: 'Share your progress with mentors. Collaborate with accountability partners',
                color: 'bg-accent-pink',
              },
              {
                icon: Zap,
                title: 'Weekly Log',
                description: 'Spreadsheet-like interface for detailed weekly tracking and review',
                color: 'bg-accent-orange',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-brutal transition-shadow hover:shadow-brutal-lg"
              >
                <div
                  className={`h-14 w-14 ${feature.color} mb-4 flex items-center justify-center border-3 border-secondary shadow-brutal-sm`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-bold uppercase">{feature.title}</h3>
                <p className="font-mono text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Simple Pricing</h2>
            <p className="font-mono text-xl text-gray-600">Choose the plan that works for you</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal"
            >
              <div className="badge-brutal mb-4 bg-gray-100">Free</div>
              <div className="mb-2 font-mono text-4xl font-bold">$0</div>
              <p className="mb-6 font-mono text-gray-600">Perfect for getting started</p>

              <ul className="mb-8 space-y-3">
                {[
                  '3 Active Goals',
                  '5 Schedule Blocks',
                  '3 Tasks Per Day',
                  'Basic Analytics',
                  '7-Day Data History',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono">
                    <CheckCircle className="h-5 w-5 text-accent-green" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="btn-brutal-secondary block w-full text-center">
                Start Free
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored relative overflow-hidden bg-primary"
            >
              <div className="absolute right-0 top-0 bg-secondary px-4 py-1 text-sm font-bold uppercase text-white">
                Popular
              </div>

              <div className="badge-brutal mb-4 bg-white">Pro</div>
              <div className="mb-2 font-mono text-4xl font-bold">
                $10<span className="text-xl">/month</span>
              </div>
              <p className="mb-6 font-mono">Unlimited productivity power</p>

              <ul className="mb-8 space-y-3">
                {[
                  'Unlimited Goals',
                  'Unlimited Schedules',
                  'Unlimited Tasks',
                  'Advanced Analytics',
                  'Unlimited Data History',
                  'Priority Support',
                  'Export Reports',
                  'Share with Team',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup?plan=pro" className="btn-brutal-dark block w-full text-center">
                Get Pro
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center border-3 border-white bg-primary shadow-brutal">
              <Zap className="h-10 w-10 text-secondary" />
            </div>

            <h2 className="mb-6 font-display text-4xl font-bold uppercase md:text-5xl">Ready to Master Your Time?</h2>

            <p className="mx-auto mb-8 max-w-2xl font-mono text-xl text-gray-300">
              Join hundreds of developers who are tracking their goals and becoming more productive every day.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="btn-brutal flex items-center gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-3 border-secondary px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display font-bold uppercase">Time Master</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="font-mono text-sm transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/faq" className="font-mono text-sm transition-colors hover:text-primary">
                FAQ
              </Link>
              <a href="#" className="font-mono text-sm transition-colors hover:text-primary">
                Support
              </a>
            </div>

            <p className="font-mono text-sm text-gray-600">© 2025 Time Master. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
