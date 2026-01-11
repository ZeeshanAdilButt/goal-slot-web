import Link from 'next/link'

import { ArrowRight, CheckCircle, Flame, Shield } from 'lucide-react'

import { AnimatedSection } from '@/components/animated-section'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'Forever free',
    subtext: 'No credit card required',
    badge: 'Free',
    badgeColor: 'bg-gray-100',
    buttonText: 'Start Free – Zero Risk',
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
    helpText: 'Try Pro free for 60 days!',
  },
  {
    name: 'Pro',
    price: '$7',
    period: '/month',
    oldPrice: '$10/month',
    subtext: '60-day free trial included',
    badge: 'Pro',
    badgeColor: 'bg-white',
    buttonText: 'Start 60-Day Free Trial',
    buttonHref: '/signup?plan=pro',
    buttonClass: 'btn-brutal-dark',
    isPopular: true,
    popularBanner: 'Most Popular – 60-Day Free Trial',
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
    helpText: 'No charge for 60 days. Cancel anytime.',
    className: 'bg-primary scale-105',
  },
  {
    name: 'Max',
    price: '$12',
    period: '/month',
    oldPrice: '$15/month',
    subtext: '60-day free trial included',
    badge: 'Max',
    badgeColor: 'bg-white text-secondary',
    buttonText: 'Start 60-Day Free Trial',
    buttonHref: '/signup?plan=max',
    buttonClass: 'btn-brutal',
    isMax: true,
    maxBanner: 'Power User – Go Unlimited',
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
    helpText: 'No charge for 60 days. Cancel anytime.',
    className: 'bg-accent-blue text-white',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          {/* Trial Banner */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-green/30 bg-accent-green/10 px-4 py-2">
            <Flame className="h-4 w-4 text-accent-green" />
            <span className="text-sm font-semibold text-gray-800">
              60-Day Free Pro Trial for All New Users
            </span>
          </div>

          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Simple Pricing</h2>
          <p className="text-xl text-gray-600">Start with 60 days of Pro features, no credit card required</p>

          {/* Money-back guarantee */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">
              30-Day Money-Back Guarantee after trial
            </span>
          </div>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <AnimatedSection
              key={plan.name}
              initial={{ opacity: 0, x: index === 0 ? -30 : index === 1 ? 0 : 30, y: index === 1 ? 30 : 0 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              className={`card-brutal relative ${plan.className || ''} ${plan.isPopular ? 'z-10 overflow-hidden' : plan.isMax ? 'overflow-hidden' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute left-0 right-0 top-0 bg-secondary py-1 text-center text-sm font-bold uppercase text-white">
                  {plan.popularBanner}
                </div>
              )}
              {plan.isMax && (
                <div className="absolute left-0 right-0 top-0 bg-purple-600 py-1 text-center text-sm font-bold uppercase text-white">
                  {plan.maxBanner}
                </div>
              )}

              <div className={`badge-brutal ${plan.badgeColor} ${plan.isPopular || plan.isMax ? 'mt-6' : ''}`}>
                {plan.badge}
              </div>
              <div className={`mb-1 font-mono text-4xl font-bold ${plan.isMax ? 'text-white' : ''}`}>
                {plan.price}
                {plan.period && <span className="text-xl">{plan.period}</span>}
              </div>
              {plan.oldPrice && (
                <p className={`mb-1 font-mono ${plan.isMax ? 'text-blue-200' : 'text-gray-500'} line-through`}>
                  {plan.oldPrice}
                </p>
              )}
              <p
                className={`mb-4 font-mono text-sm font-bold ${plan.isMax ? 'text-primary' : plan.isPopular ? 'text-accent-green' : 'text-gray-400'}`}
              >
                {plan.subtext}
              </p>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-3 font-mono ${plan.isPopular || plan.isMax ? 'font-semibold' : ''}`}
                  >
                    <CheckCircle className={`h-5 w-5 ${plan.isMax ? 'text-white' : 'text-accent-green'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.buttonHref}
                className={`${plan.buttonClass} block w-full text-center ${plan.isPopular ? 'text-lg' : ''}`}
              >
                {plan.buttonText}
              </Link>

              <p className={`mt-3 text-center font-mono text-xs ${plan.isMax ? 'text-blue-200' : 'text-gray-400'}`}>
                {plan.helpText}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
