
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="bg-secondary py-20 md:py-32">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Transforming Ideas into Exceptional Digital Experiences
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            We are a passionate team dedicated to crafting innovative and high-quality web solutions. Let&apos;s build something amazing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="#submission-form-section">
                Start Your Project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-lg">
              <Link href="#our-work-section">
                See Our Work
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative h-64 md:h-96 rounded-xl shadow-2xl overflow-hidden">
          <Image
            src="https://picsum.photos/800/600?random=1"
            alt="Creative digital agency working on a project"
            layout="fill"
            objectFit="cover"
            className="rounded-xl"
            data-ai-hint="team collaboration"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
