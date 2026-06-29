import HeroSectionGSAP from '@/components/HeroSectionGSAP';
import TestimonialSection from '@/components/TestimonialSection';
import CommunityStats from '@/components/CommunityStats';
import NewsletterSection from '@/components/NewsletterSection';
import AIShowcaseSection from '@/components/AIShowcaseSection';
import AgentCardsMarquee from '@/components/AgentCardsMarquee';

import AnalyticsSection from './sections/AnalyticsSection';
import SecuritySection from './sections/SecuritySection';
import EnvironmentConfigSection from './sections/EnvironmentConfigSection';
import CanvasBuilderSection from './sections/CanvasBuilderSection';
import DataGeneratorSection from './sections/DataGeneratorSection';
import FAQSection from './sections/FAQSection';
import NewsSection from './sections/NewsSection';
import IntegrationsSection from './sections/IntegrationsSection';
import RoadmapSection from './sections/RoadmapSection';
import TrustSecuritySection from './sections/TrustSecuritySection';
import PricingSection from './sections/PricingSection';
import WhyChooseUsSection from './sections/WhyChooseUsSection';
import CTASection from './sections/CTASection';

// Homepage — composes the hero and each marketing section.
// Individual section markup lives in ./sections/* to keep this file readable.
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* GSAP Hero Section - Clean, professional animation */}
      <HeroSectionGSAP />

      {/* Agent Cards Marquee - Scrolling Cards */}
      <AgentCardsMarquee />

      {/* Real-time Analytics Section - Image Left */}
      <AnalyticsSection />

      {/* Enterprise Security Section - Image Right */}
      <SecuritySection />

      {/* Environment Configuration Section - Image Left */}
      <EnvironmentConfigSection />

      {/* AI Showcase Section - Animated screenshots */}
      <AIShowcaseSection />

      {/* Canvas Builder Section - AI App Generator */}
      <CanvasBuilderSection />

      {/* AI Data Generator Section - Mirror layout of Canvas */}
      <DataGeneratorSection />

      {/* Testimonials Section - Dark Theme Updated */}
      <TestimonialSection />

      {/* Community Stats Section */}
      <CommunityStats />

      {/* FAQ Section - Image Left, Content Right */}
      <FAQSection />

      {/* News Section - Content Left, Image Right */}
      <NewsSection />

      {/* Integration Partners Section - Image Left, Content Right */}
      <IntegrationsSection />

      {/* Feature Roadmap Section - Content Left, Image Right */}
      <RoadmapSection />

      {/* Trust & Security Section - Image Left, Content Right */}
      <TrustSecuritySection />

      {/* Newsletter Section - Content Left, Image Right */}
      <NewsletterSection />

      {/* Pricing Section - Image Left, Content Right */}
      <PricingSection />

      {/* Why Choose Us Section - Content Left, Image Right */}
      <WhyChooseUsSection />

      {/* CTA Section - Image Left, Content Right */}
      <CTASection />
    </div>
  );
}
