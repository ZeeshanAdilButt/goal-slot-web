import { AlertCircle, Brain, Clock, Target, TrendingUp } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const painPoints = [
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
]

export function ProblemSection() {
  return (
    <section id="problem" className="border-y-3 border-secondary bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
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
        </AnimatedSection>

        {/* Pain Points Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((pain, i) => (
            <AnimatedSection
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
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
