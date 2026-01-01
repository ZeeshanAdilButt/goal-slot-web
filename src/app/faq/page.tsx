'use client'

import { useState } from 'react'

import Link from 'next/link'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  CreditCard,
  HelpCircle,
  Lock,
  Share2,
  Target,
  Users,
  Zap,
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ReactNode
  color: string
  items: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: <Zap className="h-6 w-6" />,
    color: 'bg-primary',
    items: [
      {
        question: 'What is GoalSlot?',
        answer:
          'GoalSlot is a productivity tracking application designed for developers and learners. It helps you set goals, track time, manage tasks, and visualize your progress.',
      },
      {
        question: 'How do I create an account?',
        answer:
          'You can sign up using your email address. Click the "Get Started" button on our homepage, fill in your details, and you\'re ready to go!',
      },
      {
        question: 'Is GoalSlot free to use?',
        answer:
          "Yes! We offer a generous free tier that includes all essential features. Premium features are available for users who want advanced analytics, team collaboration, and priority support.",
      },
    ],
  },
  {
    title: 'Goals & Tasks',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-accent-green',
    items: [
      {
        question: 'How do I set up my first goal?',
        answer:
          "Navigate to the Goals section in your dashboard and click 'Add Goal'. Give your goal a title, description, target hours, and deadline. You can also categorize goals and break them down into smaller milestones.",
      },
      {
        question: "What's the difference between goals and tasks?",
        answer:
          "Goals are your larger objectives (like 'Learn React' or 'Complete 100 LeetCode problems'). Tasks are smaller, actionable items you work on daily. Tasks can be linked to goals to track progress toward your bigger objectives.",
      },
      {
        question: 'Can I organize my goals by category?',
        answer:
          "Yes! You can create custom categories like 'Learning', 'Work', 'Open Source', etc. This helps you visualize how you're spending time across different areas of your development journey.",
      },
      {
        question: 'How do goal streaks work?',
        answer:
          "Streaks track consecutive days you've logged time toward a goal. Maintaining streaks is a great way to build consistent habits. If you miss a day, your streak resets, but your total progress is never lost.",
      },
    ],
  },
  {
    title: 'Time Tracking',
    icon: <Clock className="h-6 w-6" />,
    color: 'bg-accent-blue',
    items: [
      {
        question: 'How do I track my time?',
        answer:
          "Use the timer on your dashboard to track time in real-time, or manually add time entries after completing work. You can assign each entry to a specific goal or task for better organization.",
      },
      {
        question: 'Can I edit or delete time entries?',
        answer:
          "Yes, you can edit any time entry to correct mistakes or add notes. You can also void entries if they were logged incorrectly, which removes them from your statistics while keeping a record.",
      },
      {
        question: 'What reports can I generate?',
        answer:
          'GoalSlot offers daily, weekly, and monthly reports showing your productivity patterns. See breakdowns by goal, category, or time of day. Export reports as PDFs or share them with your mentor.',
      },
      {
        question: 'Does the timer work offline?',
        answer:
          "The timer requires an internet connection to sync accurately. However, you can always add manual time entries later if you worked offline.",
      },
    ],
  },
  {
    title: 'Sharing & Collaboration',
    icon: <Share2 className="h-6 w-6" />,
    color: 'bg-accent-pink',
    items: [
      {
        question: 'How do I share my progress with my mentor?',
        answer:
          "Go to the Sharing section and create a share link. You can choose what to share (goals, time entries, reports) and set expiration dates. Your mentor can view your progress without needing an account.",
      },
      {
        question: 'Can I make my profile public?',
        answer:
          "Yes! You can create a public profile that showcases your goals and achievements. This is great for accountability and inspiring others in the community.",
      },
      {
        question: 'Is there a leaderboard?',
        answer:
          "We have optional community leaderboards where you can compare your progress with other users. Participation is completely voluntary and can be toggled off anytime.",
      },
    ],
  },
  {
    title: 'Account & Security',
    icon: <Lock className="h-6 w-6" />,
    color: 'bg-accent-orange',
    items: [
      {
        question: 'How is my data protected?',
        answer:
          "All data is encrypted in transit and at rest. We use industry-standard security practices and never sell your personal information. Check our Privacy Policy for complete details.",
      },
      {
        question: 'Can I export my data?',
        answer:
          "Yes! You can export all your data (goals, tasks, time entries) in JSON or CSV format anytime from your account settings. We believe you should always have access to your data.",
      },
      {
        question: 'How do I delete my account?',
        answer:
          "Go to Account Settings and select 'Delete Account'. This will permanently remove all your data. Note that this action cannot be undone, so please export your data first if needed.",
      },
      {
        question: 'What authentication methods do you support?',
        answer:
          'We support email/password authentication and Google OAuth. Two-factor authentication is available for premium accounts.',
      },
    ],
  },
  {
    title: 'Premium & Billing',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'bg-purple-500',
    items: [
      {
        question: 'What features are included in Premium?',
        answer:
          "Premium includes advanced analytics, unlimited goal categories, priority support, team collaboration features, custom themes, and API access for integrations.",
      },
      {
        question: 'How do I upgrade to Premium?',
        answer:
          "Click on 'Upgrade' in your dashboard or visit the pricing page. We accept all major credit cards and offer monthly or annual billing with a discount for yearly subscriptions.",
      },
      {
        question: 'Can I get a refund?',
        answer:
          "We offer a 14-day money-back guarantee. If you're not satisfied with Premium, contact support within 14 days of purchase for a full refund.",
      },
      {
        question: 'Do you offer student discounts?',
        answer:
          'Yes! Students get 50% off Premium with a valid student email address.',
      },
    ],
  },
]

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-3 border-secondary bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="pr-4 font-bold">{item.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-secondary bg-gray-50 p-4 font-mono text-gray-700">{item.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const filteredCategories = activeCategory
    ? faqCategories.filter((cat) => cat.title === activeCategory)
    : faqCategories

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
              <span className="font-display text-xl font-bold uppercase tracking-tight">GoalSlot</span>
              <span className="block font-mono text-xs uppercase text-gray-600">Productivity Tracker</span>
            </div>
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
      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-5xl">
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
            <div className="card-brutal mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center border-3 border-secondary bg-accent-pink shadow-brutal">
                  <HelpCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="mb-2 font-display text-4xl font-bold uppercase md:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="font-mono text-lg text-gray-600">
                Everything you need to know about GoalSlot
              </p>
            </div>

            {/* Category Filter */}
            <div className="mb-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex items-center gap-2 border-3 border-secondary px-4 py-2 font-bold uppercase transition-all ${
                  activeCategory === null
                    ? 'bg-secondary text-white shadow-brutal-sm'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                All
              </button>
              {faqCategories.map((category) => (
                <button
                  key={category.title}
                  onClick={() => setActiveCategory(activeCategory === category.title ? null : category.title)}
                  className={`flex items-center gap-2 border-3 border-secondary px-4 py-2 font-bold uppercase transition-all ${
                    activeCategory === category.title
                      ? `${category.color} text-white shadow-brutal-sm`
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {category.icon}
                  {category.title}
                </button>
              ))}
            </div>

            {/* FAQ Categories */}
            <div className="space-y-10">
              {filteredCategories.map((category, categoryIndex) => {
                const actualCategoryIndex = faqCategories.findIndex((c) => c.title === category.title)
                return (
                  <motion.section
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                  >
                    {/* Category Header */}
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center border-3 border-secondary ${category.color} shadow-brutal-sm`}
                      >
                        {category.icon}
                      </div>
                      <h2 className="font-display text-2xl font-bold uppercase">{category.title}</h2>
                    </div>

                    {/* FAQ Items */}
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <FAQAccordion
                          key={itemIndex}
                          item={item}
                          isOpen={openItems[`${actualCategoryIndex}-${itemIndex}`] || false}
                          onToggle={() => toggleItem(actualCategoryIndex, itemIndex)}
                        />
                      ))}
                    </div>
                  </motion.section>
                )
              })}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              <div className="card-brutal bg-secondary text-center text-white">
                <h3 className="mb-4 font-display text-2xl font-bold uppercase">Still Have Questions?</h3>
                <p className="mb-6 font-mono">
                  Can't find what you're looking for? Our support team is here to help!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="mailto:support@goalslot.com"
                    className="btn-brutal flex items-center gap-2"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-secondary px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display font-bold uppercase">GoalSlot</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="font-mono text-sm transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/faq" className="font-mono text-sm font-bold text-primary">
                FAQ
              </Link>
              <a href="#" className="font-mono text-sm transition-colors hover:text-primary">
                Support
              </a>
            </div>

            <p className="font-mono text-sm text-gray-600">© 2025 GoalSlot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
