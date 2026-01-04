'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  Flame,
  Gift,
  Heart,
  Minus,
  Quote,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'

// Custom SVG Components for illustrations
const GoalAchievementSVG = () => (
  <svg viewBox="0 0 400 300" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="200" cy="150" r="120" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
    <circle cx="200" cy="150" r="80" fill="#FFD700" stroke="#000" strokeWidth="3" />
    <circle cx="200" cy="150" r="40" fill="#22C55E" stroke="#000" strokeWidth="3" />
    {/* Target center */}
    <circle cx="200" cy="150" r="15" fill="#000" />
    {/* Arrow hitting target */}
    <path d="M320 50 L210 140" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <polygon points="205,145 220,130 215,155" fill="#000" />
    {/* Arrow tail feathers */}
    <path d="M320 50 L340 30 M320 50 L345 55 M320 50 L325 75" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
    {/* Sparkles around target */}
    <path d="M100 100 L110 90 L120 100 L110 110 Z" fill="#FFD700" stroke="#000" strokeWidth="2" />
    <path d="M280 200 L290 190 L300 200 L290 210 Z" fill="#FFD700" stroke="#000" strokeWidth="2" />
    <path d="M150 220 L155 210 L160 220 L155 230 Z" fill="#3B82F6" stroke="#000" strokeWidth="2" />
  </svg>
)

const BeforeAfterSVG = ({ type }: { type: 'before' | 'after' }) => {
  if (type === 'before') {
    return (
      <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stressed person */}
        <circle cx="100" cy="70" r="40" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
        {/* Stressed eyes */}
        <path
          d="M85 65 L90 70 L85 75"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M115 65 L110 70 L115 75"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Stressed eyebrows */}
        <path d="M78 55 L92 60" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <path d="M108 60 L122 55" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        {/* Frown */}
        <path d="M85 90 Q100 82 115 90" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sweat drops */}
        <ellipse cx="135" cy="60" rx="4" ry="6" fill="#3B82F6" />
        <ellipse cx="140" cy="75" rx="3" ry="5" fill="#3B82F6" />
        {/* Scattered papers/tasks around */}
        <rect
          x="30"
          y="130"
          width="30"
          height="25"
          fill="#EF4444"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(-15 45 142)"
        />
        <rect
          x="70"
          y="140"
          width="30"
          height="25"
          fill="#F97316"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(10 85 152)"
        />
        <rect
          x="110"
          y="135"
          width="30"
          height="25"
          fill="#8B5CF6"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(-5 125 147)"
        />
        <rect
          x="150"
          y="130"
          width="30"
          height="25"
          fill="#3B82F6"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(12 165 142)"
        />
        {/* X marks */}
        <text x="40" y="148" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        <text x="80" y="158" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        <text x="120" y="153" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        {/* Question marks floating */}
        <text x="55" y="50" fontSize="16" fontWeight="bold" fill="#EC4899">
          ?
        </text>
        <text x="140" y="45" fontSize="14" fontWeight="bold" fill="#F97316">
          ?
        </text>
        <text x="45" y="100" fontSize="12" fontWeight="bold" fill="#8B5CF6">
          ?
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Happy person */}
      <circle cx="100" cy="70" r="40" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
      {/* Happy eyes */}
      <circle cx="85" cy="65" r="5" fill="#000" />
      <circle cx="115" cy="65" r="5" fill="#000" />
      {/* Eye sparkle */}
      <circle cx="87" cy="63" r="2" fill="#FFF" />
      <circle cx="117" cy="63" r="2" fill="#FFF" />
      {/* Happy eyebrows */}
      <path d="M78 55 L92 52" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <path d="M108 52 L122 55" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      {/* Big smile */}
      <path d="M80 82 Q100 100 120 82" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Organized progress bars */}
      <rect x="30" y="130" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="130" width="120" height="15" fill="#22C55E" stroke="#000" strokeWidth="2" />
      <rect x="30" y="150" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="150" width="95" height="15" fill="#3B82F6" stroke="#000" strokeWidth="2" />
      <rect x="30" y="170" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="170" width="140" height="15" fill="#FFD700" stroke="#000" strokeWidth="2" />
      {/* Check marks */}
      <text x="175" y="143" fontSize="12" fontWeight="bold" fill="#22C55E">
        ✓
      </text>
      <text x="175" y="163" fontSize="12" fontWeight="bold" fill="#3B82F6">
        ↗
      </text>
      <text x="175" y="183" fontSize="12" fontWeight="bold" fill="#FFD700">
        ★
      </text>
      {/* Stars around head */}
      <path d="M50 40 L55 30 L60 40 L50 35 L60 35 Z" fill="#FFD700" stroke="#000" strokeWidth="1" />
      <path d="M140 35 L145 25 L150 35 L140 30 L150 30 Z" fill="#FFD700" stroke="#000" strokeWidth="1" />
      <path d="M155 70 L160 60 L165 70 L155 65 L165 65 Z" fill="#EC4899" stroke="#000" strokeWidth="1" />
    </svg>
  )
}

const FragmentedToolsSVG = () => (
  <svg viewBox="0 0 300 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scattered boxes representing different apps */}
    <rect
      x="20"
      y="30"
      width="60"
      height="50"
      fill="#EF4444"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-5 50 55)"
    />
    <text x="35" y="60" fontSize="10" fontWeight="bold" fill="#FFF">
      Toggl
    </text>

    <rect
      x="100"
      y="20"
      width="60"
      height="50"
      fill="#8B5CF6"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(8 130 45)"
    />
    <text x="110" y="50" fontSize="10" fontWeight="bold" fill="#FFF">
      Notion
    </text>

    <rect
      x="180"
      y="40"
      width="60"
      height="50"
      fill="#F97316"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-3 210 65)"
    />
    <text x="190" y="70" fontSize="10" fontWeight="bold" fill="#FFF">
      Todoist
    </text>

    <rect
      x="60"
      y="100"
      width="60"
      height="50"
      fill="#3B82F6"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(5 90 125)"
    />
    <text x="68" y="130" fontSize="10" fontWeight="bold" fill="#FFF">
      Calendar
    </text>

    <rect
      x="160"
      y="110"
      width="60"
      height="50"
      fill="#22C55E"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-7 190 135)"
    />
    <text x="168" y="140" fontSize="10" fontWeight="bold" fill="#FFF">
      Sheets
    </text>

    {/* Chaos lines */}
    <path d="M80 55 Q120 80 100 95" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />
    <path d="M160 45 Q200 90 160 135" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />
    <path d="M90 125 L160 135" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />

    {/* X marks for frustration */}
    <text x="130" y="90" fontSize="24" fontWeight="bold" fill="#EF4444">
      ✗
    </text>
  </svg>
)

const UnifiedSystemSVG = () => (
  <svg viewBox="0 0 300 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Connection lines - drawn first so they appear behind everything */}
    <line x1="75" y1="75" x2="50" y2="60" stroke="#000" strokeWidth="3" />
    <line x1="225" y1="75" x2="250" y2="60" stroke="#000" strokeWidth="3" />
    <line x1="75" y1="125" x2="50" y2="140" stroke="#000" strokeWidth="3" />
    <line x1="225" y1="125" x2="250" y2="140" stroke="#000" strokeWidth="3" />

    {/* Central unified box */}
    <rect x="75" y="50" width="150" height="100" fill="#FFD700" stroke="#000" strokeWidth="4" />
    <text x="150" y="95" fontSize="14" fontWeight="bold" fill="#000" textAnchor="middle">
      GOAL
    </text>
    <text x="150" y="115" fontSize="14" fontWeight="bold" fill="#000" textAnchor="middle">
      SLOT
    </text>

    {/* Connected feature circles with text centered */}
    <circle cx="50" cy="60" r="25" fill="#22C55E" stroke="#000" strokeWidth="3" />
    <text x="50" y="64" fontSize="8" fontWeight="bold" fill="#000" textAnchor="middle">
      Goals
    </text>

    <circle cx="250" cy="60" r="25" fill="#3B82F6" stroke="#000" strokeWidth="3" />
    <text x="250" y="64" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Time
    </text>

    <circle cx="50" cy="140" r="25" fill="#EC4899" stroke="#000" strokeWidth="3" />
    <text x="50" y="144" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Schedule
    </text>

    <circle cx="250" cy="140" r="25" fill="#8B5CF6" stroke="#000" strokeWidth="3" />
    <text x="250" y="144" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Reports
    </text>

    {/* Check mark */}
    <text x="150" y="180" fontSize="24" fontWeight="bold" fill="#22C55E" textAnchor="middle">
      ✓
    </text>
  </svg>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brutalist-bg">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b-3 border-secondary bg-brutalist-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-3 border-secondary bg-primary shadow-brutal">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <span className="font-display text-xl font-bold uppercase tracking-tight">GoalSlot</span>
              <span className="block font-mono text-xs uppercase text-gray-600">Achieve Your Goals</span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#problem" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Why
            </a>
            <a href="#features" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Features
            </a>
            <a href="#pricing" className="text-sm font-bold uppercase transition-colors hover:text-primary">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-brutal-secondary px-4 py-2 text-sm">
              Login
            </Link>
            <Link href="/signup" className="btn-brutal px-4 py-2 text-sm">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Goal Achievement Focus */}
      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              {/* Urgency Badge */}
              <div className="mb-6 inline-flex items-center gap-2 border-3 border-secondary bg-accent-pink px-4 py-2 text-white shadow-brutal-sm">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-bold uppercase">Make 2026 Your Year</span>
              </div>

              <h1 className="mb-6 font-display text-5xl font-bold uppercase leading-tight md:text-6xl lg:text-7xl">
                Track Time.
                <span className="block text-accent-blue drop-shadow-[4px_4px_0px_#000]">Crush Goals.</span>
                <span className="text-primary drop-shadow-[4px_4px_0px_#000]">Ship More.</span>
              </h1>

              <p className="mb-8 max-w-lg font-mono text-xl text-gray-700">
                The all-in-one system for developers who want to <strong>stop guessing and start proving</strong> where
                their time goes. Goals, schedules, tasks, and time tracking — finally connected.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="btn-brutal flex items-center gap-2 text-lg">
                  Start Free Today <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="#problem" className="btn-brutal-secondary flex items-center gap-2">
                  See How It Works <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[
                    'from-accent-pink to-accent-purple',
                    'from-accent-blue to-accent-green',
                    'from-primary to-accent-orange',
                    'from-accent-purple to-accent-blue',
                    'from-accent-green to-primary',
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 rounded-full border-3 border-secondary bg-gradient-to-br ${gradient}`}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="font-mono text-sm">Join 500+ developers achieving their goals</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Goal Achievement Illustration */}
              <div className="card-brutal overflow-hidden p-8">
                <GoalAchievementSVG />
                <div className="mt-4 text-center">
                  <p className="font-display text-xl font-bold uppercase">Your Goals. Tracked. Achieved.</p>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-4 top-4 border-3 border-secondary bg-accent-purple p-4 text-white shadow-brutal"
              >
                <div className="font-mono text-2xl font-bold">87%</div>
                <div className="text-xs font-bold uppercase">Goals Hit</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -left-4 bottom-8 border-3 border-secondary bg-accent-blue p-4 text-white shadow-brutal"
              >
                <div className="font-mono text-2xl font-bold">142h</div>
                <div className="text-xs font-bold uppercase">Tracked</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section - The Pain Points */}
      <section id="problem" className="border-y-3 border-secondary bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 border-3 border-secondary bg-accent-pink px-4 py-2 text-white shadow-brutal-sm">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold uppercase">Sound Familiar?</span>
            </div>
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Why Do Goals Fail?</h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              You set goals with good intentions, but without a system, they slip away
            </p>
          </motion.div>

          {/* Pain Points Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Clock,
                question: '"Where did my time go?"',
                answer: "You can't manage what you don't measure",
                color: 'bg-accent-pink',
              },
              {
                icon: Target,
                question: '"Why couldn\'t I achieve it?"',
                answer: 'Goals without schedules are just dreams',
                color: 'bg-accent-orange',
              },
              {
                icon: Brain,
                question: '"What was I even doing?"',
                answer: 'No tracking = no clarity on your progress',
                color: 'bg-accent-purple',
              },
              {
                icon: TrendingUp,
                question: '"Am I even improving?"',
                answer: 'Without data, growth is invisible',
                color: 'bg-accent-blue',
              },
            ].map((pain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-brutal text-center"
              >
                <div
                  className={`mx-auto h-16 w-16 ${pain.color} mb-4 flex items-center justify-center border-3 border-secondary shadow-brutal-sm`}
                >
                  <pain.icon className="h-8 w-8 text-white" />
                </div>
                <p className="mb-3 font-display text-lg font-bold">{pain.question}</p>
                <p className="font-mono text-sm text-gray-600">{pain.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Transformation - Emotional Hook */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">
              Your Transformation Starts Here
            </h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              This is the difference between hoping and knowing
            </p>
          </motion.div>

          <div className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal bg-red-50 lg:col-span-2"
            >
              <div className="mb-4 text-center">
                <span className="badge-brutal bg-red-500 text-white">Before</span>
              </div>
              <BeforeAfterSVG type="before" />
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>"I set a goal to learn React 6 months ago... I think I watched some tutorials?"</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>"I have no idea how many hours I actually coded this month"</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>"Another year passed. Where did the time go?"</span>
                </li>
              </ul>
            </motion.div>

            {/* Arrow */}
            <div className="hidden items-center justify-center lg:flex">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex h-16 w-16 items-center justify-center border-3 border-secondary bg-primary shadow-brutal"
              >
                <ArrowRight className="h-8 w-8" />
              </motion.div>
            </div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored bg-accent-green lg:col-span-2"
            >
              <div className="mb-4 text-center">
                <span className="badge-brutal bg-white text-green-600">After</span>
              </div>
              <BeforeAfterSVG type="after" />
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 font-mono text-sm text-white">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>"I've logged 127 hours on React. My goal is 80% complete."</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm text-white">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>"Last month I coded 42 hours. This month I'm at 38 with a week left."</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm text-white">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>"I can show my mentor exactly where my time went. No guessing."</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Solution - Fragmented vs Unified */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">The Problem With Other Tools</h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              You're paying for apps that don't talk to each other
            </p>
          </motion.div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Fragmented Tools */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal bg-red-50"
            >
              <div className="mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="font-display text-xl font-bold uppercase text-red-600">The Old Way</span>
              </div>
              <FragmentedToolsSVG />
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Toggl for time ($10/mo) + Todoist for tasks ($5/mo)
                </li>
                <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Notion for goals ($10/mo) + Calendar app
                </li>
                <li className="flex items-center gap-2 font-mono text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500" />
                  None of them connect = you give up
                </li>
              </ul>
              <div className="mt-4 border-t-2 border-red-200 pt-4">
                <span className="font-mono text-lg font-bold text-red-600">$25+/month</span>
                <span className="font-mono text-sm text-gray-500"> for scattered tools</span>
              </div>
            </motion.div>

            {/* Unified System */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored bg-accent-green"
            >
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-white" />
                <span className="font-display text-xl font-bold uppercase text-white">The GoalSlot Way</span>
              </div>
              <UnifiedSystemSVG />
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2 font-mono text-sm text-white">
                  <CheckCircle className="h-4 w-4" />
                  Goals → Schedule → Time Tracking → Reports
                </li>
                <li className="flex items-center gap-2 font-mono text-sm text-white">
                  <CheckCircle className="h-4 w-4" />
                  Everything connected, everything in sync
                </li>
                <li className="flex items-center gap-2 font-mono text-sm text-white">
                  <CheckCircle className="h-4 w-4" />
                  See exactly where your time goes
                </li>
              </ul>
              <div className="mt-4 border-t-2 border-green-400 pt-4">
                <span className="font-mono text-lg font-bold text-white">From $7/month</span>
                <span className="font-mono text-sm text-green-100"> for everything unified</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Philosophy Section */}
      <section className="border-y-3 border-secondary bg-secondary px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Everything You Need</h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              One tool to rule your goals, time, and progress
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: 'Goal Tracking',
                description: 'Set goals with deadlines. Track progress. See your hours accumulate toward mastery.',
                color: 'bg-accent-green',
              },
              {
                icon: Clock,
                title: 'Time Logging',
                description: 'Live timer or manual entries. Every minute counts and gets linked to your goals.',
                color: 'bg-accent-blue',
              },
              {
                icon: Calendar,
                title: 'Weekly Schedule',
                description: 'Plan time blocks for Deep Work, Learning, DSA, Side Projects. Make goals real.',
                color: 'bg-primary',
              },
              {
                icon: BarChart3,
                title: 'Visual Analytics',
                description: 'Beautiful charts show where your time goes. No more guessing—see the data.',
                color: 'bg-accent-purple',
              },
              {
                icon: Users,
                title: 'Share & Accountability',
                description: "Share progress with mentors. Data doesn't lie—build honest habits together.",
                color: 'bg-accent-pink',
              },
              {
                icon: BookOpen,
                title: 'Notion-Like Notes',
                description:
                  'Rich editor with slash commands (/heading, /code, /list). Link notes to goals. Build your knowledge base.',
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
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold uppercase">{feature.title}</h3>
                <p className="font-mono text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="border-y-3 border-secondary bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Built For Builders</h2>
            <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
              Developers, learners, and anyone serious about growth
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Code,
                title: 'Self-Taught Developers',
                description: 'Track your #100DaysOfCode. See your learning hours stack up. Prove your progress.',
                examples: ['DSA Practice', 'New Languages', 'Side Projects'],
                color: 'bg-accent-blue',
              },
              {
                icon: TrendingUp,
                title: 'Career Developers',
                description: 'Level up outside of work. Ship side projects. Build your 10,000 hours.',
                examples: ['Open Source', 'New Frameworks', 'System Design'],
                color: 'bg-accent-green',
              },
              {
                icon: Users,
                title: 'Mentors & Mentees',
                description: 'Share real progress. Replace status meetings with dashboards. Stay accountable.',
                examples: ['Weekly Reviews', 'Goal Setting', 'Progress Sharing'],
                color: 'bg-accent-purple',
              },
            ].map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card-brutal"
              >
                <div
                  className={`h-16 w-16 ${persona.color} mb-4 flex items-center justify-center border-3 border-secondary shadow-brutal-sm`}
                >
                  <persona.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold uppercase">{persona.title}</h3>
                <p className="mb-4 font-mono text-gray-600">{persona.description}</p>
                <div className="flex flex-wrap gap-2">
                  {persona.examples.map((ex, j) => (
                    <span key={j} className="badge-brutal bg-gray-100 text-xs">
                      {ex}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Social Proof */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 border-3 border-secondary bg-primary px-4 py-2 shadow-brutal-sm">
              <Heart className="h-5 w-5" />
              <span className="font-bold uppercase">Real Results</span>
            </div>
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">
              Developers Like You Are Achieving More
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "I finally finished my side project after 8 months of 'working on it'. The difference? I could see exactly how little time I was actually spending. Embarrassing, but it worked.",
                name: 'Arjun M.',
                role: 'Full-Stack Developer',
                metric: 'Shipped 3 side projects in 4 months',
                avatar: 'A',
              },
              {
                quote:
                  'My mentor and I used to spend 30 mins each week just figuring out what I did. Now she opens my dashboard and we dive straight into learning. Game changer.',
                name: 'Priya S.',
                role: 'Junior Developer',
                metric: '200+ hours tracked on DSA prep',
                avatar: 'P',
              },
              {
                quote:
                  'I thought I was putting in 4 hours a day on my startup. GoalSlot showed me it was actually 1.5 hours. That reality check changed everything.',
                name: 'Marcus T.',
                role: 'Indie Hacker',
                metric: 'From 1.5h/day to actual 4h/day',
                avatar: 'M',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card-brutal relative"
              >
                <Quote className="absolute -left-3 -top-3 h-8 w-8 text-primary" />
                <p className="mb-6 font-mono leading-relaxed text-gray-700">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 border-t-2 border-gray-200 pt-4">
                  <div className="flex h-12 w-12 items-center justify-center border-3 border-secondary bg-primary text-xl font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="font-mono text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="mt-4 border-3 border-secondary bg-accent-green/10 p-2 text-center">
                  <span className="font-mono text-sm font-bold text-accent-green">{testimonial.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Math Section - Loss Aversion */}
      <section className="border-y-3 border-secondary bg-secondary px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
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
          </motion.div>
        </div>
      </section>

      {/* Comparison Table - Vs Competitors */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Why GoalSlot?</h2>
            <p className="font-mono text-xl text-gray-600">See how we compare to the tools you're already paying for</p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full border-3 border-secondary">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-4 text-left font-display text-sm uppercase">Feature</th>
                  <th className="p-4 text-center font-display text-sm uppercase">
                    <span className="text-primary">GoalSlot</span>
                    <span className="block font-mono text-xs text-gray-300">$7/mo</span>
                  </th>
                  <th className="p-4 text-center font-display text-sm uppercase">
                    Toggl
                    <span className="block font-mono text-xs text-gray-300">$10/mo</span>
                  </th>
                  <th className="p-4 text-center font-display text-sm uppercase">
                    Notion
                    <span className="block font-mono text-xs text-gray-300">$10/mo</span>
                  </th>
                  <th className="p-4 text-center font-display text-sm uppercase">
                    Todoist
                    <span className="block font-mono text-xs text-gray-300">$5/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { feature: 'Goal Tracking', tm: true, toggl: false, notion: 'manual', todoist: false },
                  { feature: 'Time Tracking', tm: true, toggl: true, notion: false, todoist: false },
                  { feature: 'Weekly Schedule', tm: true, toggl: false, notion: 'manual', todoist: false },
                  { feature: 'Tasks & To-Dos', tm: true, toggl: false, notion: true, todoist: true },
                  { feature: 'Notion-Like Notes', tm: true, toggl: false, notion: true, todoist: false },
                  { feature: 'Progress Analytics', tm: true, toggl: true, notion: false, todoist: 'basic' },
                  { feature: 'Goals ↔ Time Linked', tm: true, toggl: false, notion: false, todoist: false },
                  { feature: 'Share with Mentor', tm: true, toggl: 'team only', notion: true, todoist: false },
                  { feature: 'Built for Developers', tm: true, toggl: false, notion: false, todoist: false },
                ].map((row, i) => (
                  <tr key={i} className="border-t-2 border-gray-200">
                    <td className="p-4 font-mono text-sm font-bold">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.tm === true ? (
                        <CheckCircle className="mx-auto h-6 w-6 text-accent-green" />
                      ) : (
                        <span className="font-mono text-sm text-gray-400">{row.tm}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.toggl === true ? (
                        <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                      ) : row.toggl === false ? (
                        <XCircle className="mx-auto h-6 w-6 text-red-300" />
                      ) : (
                        <span className="font-mono text-xs text-gray-400">{row.toggl}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.notion === true ? (
                        <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                      ) : row.notion === false ? (
                        <XCircle className="mx-auto h-6 w-6 text-red-300" />
                      ) : (
                        <span className="font-mono text-xs text-gray-400">{row.notion}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.todoist === true ? (
                        <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                      ) : row.todoist === false ? (
                        <XCircle className="mx-auto h-6 w-6 text-red-300" />
                      ) : (
                        <span className="font-mono text-xs text-gray-400">{row.todoist}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-3 border-secondary bg-primary/10">
                  <td className="p-4 font-display font-bold uppercase">Total Cost</td>
                  <td className="p-4 text-center font-mono text-xl font-bold text-accent-green">$7/mo</td>
                  <td colSpan={3} className="p-4 text-center font-mono text-gray-500">
                    $25+/mo for all three
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section - Objection Handling */}
      <section className="border-y-3 border-secondary bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Questions? We've Got Answers</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "I've tried tracking apps before and always quit. Why would this be different?",
                a: "Because other apps only track time OR tasks OR goals. They never connect. You quit because the data felt meaningless. GoalSlot links everything: your goals show real hours logged, your schedule turns into tracked time, your progress becomes visible. When you see your hours stack up toward a goal, quitting feels like losing progress—and that's powerful motivation.",
              },
              {
                q: "I'm already using Notion/Toggl/Todoist. Do I need another app?",
                a: "You're paying $25+/month for tools that don't talk to each other. GoalSlot replaces all of them at $7/month AND connects everything. Your logged time automatically updates your goal progress. No more copying data between apps or guessing how much time you spent on what.",
              },
              {
                q: 'What if I forget to track my time?',
                a: "We've got you covered. You can manually add time entries after the fact, use the live timer, or quickly log time from your schedule. Most users find that once they see their progress chart, they WANT to track—it becomes addictive in a good way.",
              },
              {
                q: 'Is my data private? Can my employer see it?',
                a: "100% private by default. You choose what to share and with whom. Share your dashboard with a mentor? Your choice. Keep it completely private? Also your choice. We'll never sell your data or share it without your explicit permission.",
              },
              {
                q: 'What happens if I cancel?',
                a: "You can export all your data anytime. No lock-in, no hostage situation. And if you're on the free plan, you keep access forever. We want you to stay because the product is valuable, not because you're trapped.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-brutal"
              >
                <h3 className="mb-3 font-display text-lg font-bold">{faq.q}</h3>
                <p className="font-mono leading-relaxed text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            {/* Urgency Banner */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-accent-pink bg-accent-pink/20 px-4 py-2">
              <Flame className="h-5 w-5 animate-pulse text-accent-pink" />
              <span className="font-mono text-sm font-bold text-accent-pink">
                🎉 Founding Member Pricing – Lock in these rates forever!
              </span>
            </div>

            <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Simple Pricing</h2>
            <p className="font-mono text-xl text-gray-600">Choose the plan that works for you</p>

            {/* Money-back guarantee */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-accent-green bg-accent-green/10 px-4 py-2">
              <Shield className="h-5 w-5 text-accent-green" />
              <span className="font-mono text-sm font-semibold text-accent-green">
                30-Day Money-Back Guarantee – No questions asked
              </span>
            </div>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal relative"
            >
              <div className="badge-brutal mb-4 bg-gray-100">Free</div>
              <div className="mb-2 font-mono text-4xl font-bold">$0</div>
              <p className="mb-1 font-mono text-gray-600">Forever free</p>
              <p className="mb-6 font-mono text-sm text-gray-400">No credit card required</p>

              <ul className="mb-8 space-y-3">
                {[
                  '3 Active Goals',
                  '5 Schedule Blocks',
                  '3 Tasks Per Day',
                  '5 Notes',
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
                Start Free – Zero Risk
              </Link>

              <p className="mt-3 text-center font-mono text-xs text-gray-400">Upgrade anytime. No pressure.</p>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored relative z-10 scale-105 overflow-hidden bg-primary"
            >
              <div className="absolute left-0 right-0 top-0 bg-secondary py-1 text-center text-sm font-bold uppercase text-white">
                ⭐ Most Popular – Best for Most Users
              </div>

              <div className="badge-brutal mt-6 bg-white">Pro</div>
              <div className="mb-1 font-mono text-4xl font-bold">
                $7<span className="text-xl">/month</span>
              </div>
              <p className="mb-1 font-mono text-gray-500 line-through">$10/month</p>
              <p className="mb-4 font-mono text-sm font-bold text-accent-green">Save 30% – Founding Member Rate</p>

              <ul className="mb-8 space-y-3">
                {[
                  '10 Active Goals',
                  'Unlimited Schedules',
                  'Unlimited Tasks',
                  '50 Notes',
                  'Advanced Analytics',
                  '90-Day Data History',
                  'Export Reports',
                  'Share with Mentor',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup?plan=pro" className="btn-brutal-dark block w-full text-center text-lg">
                Get Pro – 30-Day Guarantee
              </Link>

              <p className="mt-3 text-center font-mono text-xs">Lock in $7/mo forever. Price goes up soon.</p>
            </motion.div>

            {/* Max Plan */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-brutal-colored relative overflow-hidden bg-accent-blue text-white"
            >
              <div className="absolute left-0 right-0 top-0 bg-purple-600 py-1 text-center text-sm font-bold uppercase text-white">
                🚀 Power User – Go Unlimited
              </div>

              <div className="badge-brutal mt-6 bg-white text-secondary">Max</div>
              <div className="mb-1 font-mono text-4xl font-bold">
                $12<span className="text-xl">/month</span>
              </div>
              <p className="mb-1 font-mono text-blue-200 line-through">$15/month</p>
              <p className="mb-4 font-mono text-sm font-bold text-primary">Save 20% – Founding Member Rate</p>

              <ul className="mb-8 space-y-3">
                {[
                  'Unlimited Goals',
                  'Unlimited Schedules',
                  'Unlimited Tasks',
                  'Unlimited Notes',
                  'Advanced Analytics',
                  'Unlimited Data History',
                  'Priority Support',
                  'Export Reports',
                  'Share with Team',
                  'API Access',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup?plan=max" className="btn-brutal block w-full text-center text-lg">
                Get Max – 30-Day Guarantee
              </Link>

              <p className="mt-3 text-center font-mono text-xs text-blue-200">
                For teams & power users. No limits ever.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Maximum Psychological Impact */}
      <section className="bg-secondary px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Emotional Hook */}
            <p className="mb-4 font-mono text-lg text-primary">
              You've read this far because something needs to change.
            </p>

            <h2 className="mb-6 font-display text-4xl font-bold uppercase md:text-6xl">
              Stop Dreaming. Start Tracking.
            </h2>

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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-3 border-secondary px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-sm">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display font-bold uppercase">GoalSlot</span>
                <span className="block font-mono text-xs text-gray-500">Achieve Your Goals</span>
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

            <p className="font-mono text-sm text-gray-600">© 2025 GoalSlot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
