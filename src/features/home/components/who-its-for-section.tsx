import { Briefcase, Code, GraduationCap } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const personas = [
  {
    icon: Code,
    title: 'Developers',
    tagline: 'Ship more. Track everything.',
    description:
      "Whether you're grinding LeetCode, building side projects, or contributing to open source—GoalSlot tracks your deep work hours and shows exactly where your time goes.",
    useCase: 'Deep work tracking, DSA practice logs, side project hours',
    color: 'bg-blue-500',
  },
  {
    icon: GraduationCap,
    title: 'Career Switchers',
    tagline: 'From learning to earning.',
    description:
      "Bootcamps, courses, certifications—you're investing serious hours. GoalSlot gives you a receipt for that effort and helps you stay accountable to your learning goals.",
    useCase: 'Learning logs, course progress, skill-building hours',
    color: 'bg-green-500',
  },
  {
    icon: Briefcase,
    title: 'Ambitious Individuals',
    tagline: 'Goals that actually get done.',
    description:
      'You have big ambitions but struggle to follow through. GoalSlot forces you to schedule your goals and track if you actually showed up. No more abandoned projects.',
    useCase: 'Goal scheduling, habit tracking, weekly reviews',
    color: 'bg-orange-500',
  },
]

export function WhoItsForSection() {
  return (
    <section
      id="personas"
      className="border-b-2 border-secondary bg-background px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Built for Builders
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            For individuals who want to track their growth with data, not feelings.
          </p>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
          {personas.map((persona, i) => (
            <AnimatedSection
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col rounded-sm border-2 border-secondary bg-white shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover"
            >
              {/* Header */}
              <div className={`border-b-2 border-secondary ${persona.color} p-4`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-white bg-white">
                    <persona.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{persona.title}</h3>
                    <p className="text-xs font-semibold text-white/80">{persona.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-4 flex-1 text-sm text-gray-700">{persona.description}</p>

                {/* Use Case */}
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Common Use Cases
                  </p>
                  <p className="text-xs text-gray-600">{persona.useCase}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Bottom message - honest, no fake claims */}
        <AnimatedSection
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            GoalSlot doesn't guarantee outcomes—but it does guarantee you'll know exactly where your
            time went.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
