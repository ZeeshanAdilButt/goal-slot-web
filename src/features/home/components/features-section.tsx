import { BarChart3, BookOpen, Calendar, Clock, Layers, Share2, Target, Zap } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const appsReplaced = [
  { name: 'Toggl', color: 'bg-red-100 text-red-700 border-red-300' },
  { name: 'Notion', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { name: 'Google Calendar', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { name: 'Todoist', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { name: 'Forest', color: 'bg-green-100 text-green-700 border-green-300' },
]

const features = [
  {
    icon: Target,
    title: 'Goal Boards',
    replaces: 'Todoist / Asana',
    description: 'Visual kanban for goals with deadlines, progress bars, and linked tasks. Not just todos—outcomes.',
    color: 'bg-primary',
    highlight: true,
  },
  {
    icon: Calendar,
    title: 'Weekly Schedule',
    replaces: 'Google Calendar',
    description: 'Recurring time blocks for Deep Work, Learning, Exercise. Your goals get real calendar commitment.',
    color: 'bg-green-500',
    highlight: true,
  },
  {
    icon: Clock,
    title: 'Live Timer',
    replaces: 'Toggl / Forest',
    description: 'One-click tracking that auto-links to your scheduled block. Manual entries work too. Every minute counts.',
    color: 'bg-blue-500',
    highlight: true,
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    replaces: 'Spreadsheets',
    description: 'Beautiful charts show where your time actually goes. Daily, weekly, monthly breakdowns by goal.',
    color: 'bg-purple-500',
    highlight: true,
  },
  {
    icon: BookOpen,
    title: 'Notes with /Slash Commands',
    replaces: 'Notion',
    description: 'Rich editor with /heading, /code, /list, /quote. Link notes to goals. Build your knowledge base as you learn.',
    color: 'bg-orange-500',
    highlight: false,
  },
  {
    icon: Share2,
    title: 'Share & Accountability',
    replaces: 'Screenshots',
    description: "Share live dashboards with mentors or accountability partners. Data doesn't lie—build honest habits.",
    color: 'bg-pink-500',
    highlight: false,
  },
  {
    icon: Layers,
    title: 'Categories & Labels',
    replaces: 'Manual tagging',
    description: 'Organize goals by category (Work, Learning, Health). Add custom labels. Filter and analyze by any dimension.',
    color: 'bg-teal-500',
    highlight: false,
  },
  {
    icon: Zap,
    title: 'Native Integration',
    replaces: 'Zapier hacks',
    description: 'Everything works together out of the box. No syncing. No Zapier. No "which app has the data?"',
    color: 'bg-yellow-500',
    highlight: false,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b-2 border-secondary bg-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Replace Your Entire Stack
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Stop juggling 5 apps that don't talk to each other. GoalSlot does it all—natively.
          </p>

          {/* Apps replaced badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-500">REPLACES:</span>
            {appsReplaced.map((app) => (
              <span
                key={app.name}
                className={`rounded-sm border px-2 py-1 font-mono text-xs font-bold line-through ${app.color}`}
              >
                {app.name}
              </span>
            ))}
          </div>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <AnimatedSection
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`group rounded-sm border-2 border-secondary bg-white p-5 shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover ${
                feature.highlight ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              <div
                className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-sm border-2 border-secondary ${feature.color} shadow-brutal-sm`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-1 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mb-2 font-mono text-xs text-gray-400">
                Replaces <span className="line-through">{feature.replaces}</span>
              </p>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </AnimatedSection>
          ))}
        </div>

        {/* Bottom CTA */}
        <AnimatedSection
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-block rounded-sm border-2 border-secondary bg-primary px-6 py-4 shadow-brutal">
            <p className="font-display text-lg font-bold">
              One app. One subscription. Everything connected.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
