
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Palette, Smartphone, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: Code2,
    title: 'Web Development',
    description: 'Building responsive, high-performance websites and web applications tailored to your business needs.',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'Creating intuitive and visually appealing user interfaces that enhance user engagement and satisfaction.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Applications',
    description: 'Developing native and cross-platform mobile apps that deliver seamless experiences on iOS and Android.',
  },
  {
    icon: Lightbulb,
    title: 'Technology Consulting',
    description: 'Providing expert advice and strategies to leverage technology for business growth and efficiency.',
  },
];

export function ServicesSection() {
  return (
    <section id="services-section" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            What We Offer
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comprehensive solutions to power your digital presence.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                  <service.icon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
