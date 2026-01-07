import { ComparisonSection } from './comparison-section'
import { CTASection } from './cta-section'
import { FAQSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { Footer } from './footer'
import { HeroSection } from './hero-section'
import { MathSection } from './math-section'
import { Navigation } from './navigation'
import { PhilosophySection } from './philosophy-section'
import { PricingSection } from './pricing-section'
import { ProblemSection } from './problem-section'
import { SolutionSection } from './solution-section'
import { TestimonialsSection } from './testimonials-section'
import { TransformationSection } from './transformation-section'
import { WhoItsForSection } from './who-its-for-section'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brutalist-bg">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <TransformationSection />
      <SolutionSection />
      <PhilosophySection />
      <FeaturesSection />
      <WhoItsForSection />
      <TestimonialsSection />
      <MathSection />
      <ComparisonSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
