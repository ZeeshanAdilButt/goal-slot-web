import { Code, TrendingUp, Users } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const personas = [
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
]

export function WhoItsForSection() {
  return (
    <section className="border-y-3 border-secondary bg-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Built For Builders</h2>
          <p className="mx-auto max-w-2xl font-mono text-xl text-gray-600">
            Developers, learners, and anyone serious about growth
          </p>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-3">
          {personas.map((persona, i) => (
            <AnimatedSection
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
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
