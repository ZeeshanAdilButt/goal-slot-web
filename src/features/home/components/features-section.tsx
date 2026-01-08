import { BarChart3, BookOpen, Calendar, Clock, Target, Users } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const features = [
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
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Everything You Need</h2>
          <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
            One tool to rule your goals, time, and progress
          </p>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimatedSection
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
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
