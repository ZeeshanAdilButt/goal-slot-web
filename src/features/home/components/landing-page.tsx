import { ComparisonSection } from './comparison-section'
import { CompoundEffectSection } from './compound-effect-section'
import { CTASection } from './cta-section'
import { FAQSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { Footer } from './footer'
import { HeroSection } from './hero-section'
import { Navigation } from './navigation'
import { PhilosophySection } from './philosophy-section'
import { PricingSection } from './pricing-section'
import { ProblemSection } from './problem-section'
import { SocialProofSection } from './social-proof-section'
import { SolutionSection } from './solution-section'
import { TransformationSection } from './transformation-section'
import { VisualShowcaseSection } from './visual-showcase-section'
import { WhoItsForSection } from './who-its-for-section'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      <HeroSection />
      <SocialProofSection />
      <ProblemSection />
      <PhilosophySection />
      <VisualShowcaseSection />
      <WhoItsForSection />
      <CompoundEffectSection />
      <FeaturesSection />
      <SolutionSection />
      <TransformationSection />
      <ComparisonSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
