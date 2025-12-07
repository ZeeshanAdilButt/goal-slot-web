'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Zap, Target, Clock, Calendar, BarChart3, Users, 
  CheckCircle, ArrowRight, Star, ChevronRight 
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brutalist-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brutalist-bg border-b-3 border-secondary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary border-3 border-secondary shadow-brutal flex items-center justify-center">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <span className="font-display font-bold text-xl uppercase tracking-tight">DevWeekends</span>
              <span className="block text-xs font-mono uppercase text-gray-600">Time Master</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="font-bold uppercase text-sm hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="font-bold uppercase text-sm hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="font-bold uppercase text-sm hover:text-primary transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-brutal-secondary text-sm py-2 px-4">
              Login
            </Link>
            <Link href="/signup" className="btn-brutal text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary border-3 border-secondary px-4 py-2 mb-6 shadow-brutal-sm">
                <Zap className="w-4 h-4" />
                <span className="font-bold uppercase text-sm">For DevWeekends Community</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold uppercase leading-tight mb-6">
                Master Your
                <span className="block text-primary drop-shadow-[4px_4px_0px_#000]">Time</span>
                Achieve Your
                <span className="block text-accent-blue drop-shadow-[4px_4px_0px_#000]">Goals</span>
              </h1>

              <p className="text-xl font-mono text-gray-700 mb-8 max-w-lg">
                The ultimate productivity tracking tool for mentees and mentors. 
                Track goals, log time, plan schedules, and visualize your progress.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="btn-brutal flex items-center gap-2">
                  Start Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn-brutal-dark flex items-center gap-2">
                  DW Member Login <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-orange border-3 border-secondary"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm font-mono">500+ Active Users</span>
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
              <div className="card-brutal p-0 overflow-hidden">
                <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between">
                  <span className="font-bold uppercase text-sm">Dashboard Preview</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent-pink" />
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-3 h-3 rounded-full bg-accent-green" />
                  </div>
                </div>
                <div className="p-6 bg-brutalist-bg">
                  {/* Mock dashboard content */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Today's Focus", value: "3h 2m", color: "bg-accent-pink" },
                      { label: "Weekly Total", value: "4h 2m", color: "bg-accent-blue" },
                      { label: "Active Goals", value: "5", color: "bg-accent-green" },
                      { label: "Tasks Logged", value: "4", color: "bg-primary" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.color} border-3 border-secondary p-3 shadow-brutal-sm`}>
                        <div className="text-2xl font-bold font-mono">{stat.value}</div>
                        <div className="text-xs font-bold uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mock goals */}
                  <div className="space-y-3">
                    {[
                      { title: "Open Source", category: "Learning", progress: 0, color: "border-l-green-500" },
                      { title: "200 DSA", category: "Work", progress: 1, color: "border-l-blue-500" },
                      { title: "Learn React", category: "Learning", progress: 3, color: "border-l-blue-500" },
                    ].map((goal, i) => (
                      <div key={i} className={`bg-white border-3 border-secondary p-4 border-l-8 ${goal.color}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold uppercase">{goal.title}</span>
                          <span className="badge-brutal bg-gray-100">{goal.category}</span>
                        </div>
                        <div className="progress-brutal">
                          <div 
                            className="progress-brutal-fill bg-primary"
                            style={{ width: `${goal.progress}%` }}
                          />
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
                className="absolute -top-6 -right-6 w-20 h-20 bg-primary border-3 border-secondary shadow-brutal-lg flex items-center justify-center"
              >
                <Target className="w-10 h-10" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent-blue border-3 border-secondary shadow-brutal flex items-center justify-center"
              >
                <Clock className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white border-y-3 border-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase mb-4">
              Everything You Need
            </h2>
            <p className="text-xl font-mono text-gray-600 max-w-2xl mx-auto">
              A complete productivity suite designed for developers and learners
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Goal Tracking",
                description: "Set SMART goals with deadlines, track progress, and celebrate achievements",
                color: "bg-accent-green",
              },
              {
                icon: Clock,
                title: "Time Logging",
                description: "Log time with a live timer or manual entries. Link to goals for automatic tracking",
                color: "bg-accent-blue",
              },
              {
                icon: Calendar,
                title: "Weekly Schedule",
                description: "Plan your week with time blocks. Visualize your productivity patterns",
                color: "bg-primary",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Beautiful charts and insights. Understand where your time goes",
                color: "bg-accent-purple",
              },
              {
                icon: Users,
                title: "Sharing",
                description: "Share your progress with mentors. Collaborate with accountability partners",
                color: "bg-accent-pink",
              },
              {
                icon: Zap,
                title: "Weekly Log",
                description: "Spreadsheet-like interface for detailed weekly tracking and review",
                color: "bg-accent-orange",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-brutal hover:shadow-brutal-lg transition-shadow"
              >
                <div className={`w-14 h-14 ${feature.color} border-3 border-secondary shadow-brutal-sm flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold uppercase mb-2">{feature.title}</h3>
                <p className="font-mono text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl font-mono text-gray-600">
              DevWeekends members get Pro for free!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal"
            >
              <div className="badge-brutal bg-gray-100 mb-4">Free</div>
              <div className="text-4xl font-bold font-mono mb-2">$0</div>
              <p className="font-mono text-gray-600 mb-6">Perfect for getting started</p>

              <ul className="space-y-3 mb-8">
                {[
                  "3 Active Goals",
                  "5 Schedule Blocks",
                  "3 Tasks Per Day",
                  "Basic Analytics",
                  "7-Day Data History",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono">
                    <CheckCircle className="w-5 h-5 text-accent-green" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="btn-brutal-secondary w-full text-center block">
                Start Free
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored bg-primary relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-1 font-bold text-sm uppercase">
                Popular
              </div>

              <div className="badge-brutal bg-white mb-4">Pro</div>
              <div className="text-4xl font-bold font-mono mb-2">
                $10<span className="text-xl">/month</span>
              </div>
              <p className="font-mono mb-6">Unlimited productivity power</p>

              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited Goals",
                  "Unlimited Schedules",
                  "Unlimited Tasks",
                  "Advanced Analytics",
                  "Unlimited Data History",
                  "Priority Support",
                  "Export Reports",
                  "Share with Team",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup?plan=pro" className="btn-brutal-dark w-full text-center block">
                Get Pro
              </Link>

              <p className="text-center font-mono text-sm mt-4">
                ⚡ Free for DevWeekends Members
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-secondary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 bg-primary border-3 border-white shadow-brutal mx-auto mb-8 flex items-center justify-center">
              <Zap className="w-10 h-10 text-secondary" />
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase mb-6">
              Ready to Master Your Time?
            </h2>

            <p className="text-xl font-mono text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of developers who are tracking their goals and becoming more productive every day.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="btn-brutal flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/login?sso=true" 
                className="bg-white text-secondary border-3 border-white px-6 py-3 font-bold uppercase shadow-brutal hover:shadow-brutal-hover transition-all flex items-center gap-2"
              >
                DevWeekends SSO <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-3 border-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary border-3 border-secondary shadow-brutal-sm flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold uppercase">DevWeekends Time Master</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="font-mono text-sm hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="font-mono text-sm hover:text-primary transition-colors">Terms</a>
              <a href="#" className="font-mono text-sm hover:text-primary transition-colors">Support</a>
              <a href="https://devweekends.com" target="_blank" className="font-mono text-sm hover:text-primary transition-colors">DevWeekends</a>
            </div>

            <p className="font-mono text-sm text-gray-600">
              © 2025 DevWeekends. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
