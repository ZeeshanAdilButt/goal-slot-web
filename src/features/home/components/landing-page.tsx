import { CTASection } from './cta-section'
import { FAQSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { Footer } from './footer'
import { HeroSection } from './hero-section'
import { Navigation } from './navigation'
import { PricingSection } from './pricing-section'
import { ProblemSection } from './problem-section'
import { SocialProofSection } from './social-proof-section'
import { SolutionSection } from './solution-section'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <HeroSection />
      <SocialProofSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
