import { SubmissionForm } from '@/components/submission-form';
import { MainHeader } from '@/components/layout/main-header';
import { HeroSection } from '@/components/landing/hero-section';
import { OurWorkSection } from '@/components/landing/our-work-section';
import { ServicesSection } from '@/components/landing/services-section';
import { AboutUsSection } from '@/components/landing/about-us-section';
import { CtaSection } from '@/components/landing/cta-section';
import { MainFooter } from '@/components/layout/main-footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex-grow">
        <HeroSection />
        <OurWorkSection />
        <ServicesSection />
        <AboutUsSection />
        <CtaSection />
        <section id="submission-form-section" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <SubmissionForm />
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
