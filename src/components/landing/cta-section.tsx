
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="cta-section" className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          Ready to Start Your Next Project?
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
          We&apos;re excited to hear about your ideas and help you bring them to life. Submit your project details today, and let&apos;s create something incredible together.
        </p>
        <Button asChild size="lg" variant="secondary" className="shadow-lg text-primary hover:bg-secondary/90">
          <Link href="#submission-form-section">
            Submit Your Project Brief <Send className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
