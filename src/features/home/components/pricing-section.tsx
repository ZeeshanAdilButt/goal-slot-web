import Link from 'next/link'

import { ArrowRight, CheckCircle } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    subtext: 'No credit card required',
    buttonText: 'Get Started',
    buttonHref: '/signup',
    buttonClass: 'btn-brutal-secondary',
    features: [
      '3 Active Goals',
      '5 Schedule Blocks',
      '3 Tasks Per Day',
      '5 Notes',
      'Basic Analytics',
      '7-Day Data History',
    ],
  },
  {
    name: 'Pro',
    price: '$7',
    period: '/month',
    subtext: '60-day free trial',
    buttonText: 'Start Free Trial',
    buttonHref: '/signup?plan=pro',
    buttonClass: 'btn-brutal',
    isPopular: true,
    features: [
      '10 Active Goals',
      'Unlimited Schedules',
      'Unlimited Tasks',
      '50 Notes',
      'Advanced Analytics',
      '90-Day Data History',
      'Export Reports',
      'Share with Mentor',
    ],
  },
  {
    name: 'Max',
    price: '$12',
    period: '/month',
    subtext: '60-day free trial',
    buttonText: 'Start Free Trial',
    buttonHref: '/signup?plan=max',
    buttonClass: 'btn-brutal-secondary',
    features: [
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
    ],
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="border-b-2 border-secondary bg-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free. Upgrade when you need more.
          </p>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <AnimatedSection
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-sm border-2 border-secondary bg-white p-6 shadow-brutal ${
                plan.isPopular ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-sm border-2 border-secondary bg-primary px-3 py-1 text-xs font-bold uppercase">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{plan.subtext}</p>
              </div>

              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.buttonHref}
                className={`${plan.buttonClass} flex w-full items-center justify-center gap-2`}
              >
                {plan.buttonText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          All paid plans include a 60-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
