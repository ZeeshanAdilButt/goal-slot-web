import { Heart, Quote } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const testimonials = [
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
]

export function TestimonialsSection() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-gray-700">Real Results</span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">
            Developers Like You Are Achieving More
          </h2>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <AnimatedSection
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
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
