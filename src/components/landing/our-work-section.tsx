
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: 'E-commerce Platform Overhaul',
    description: 'Revitalized an online retail experience with a modern UI, streamlined checkout, and improved performance.',
    imageUrl: 'https://picsum.photos/600/400?random=2',
    aiHint: 'online store',
    tags: ['UI/UX', 'Web Development', 'E-commerce'],
    liveLink: '#',
  },
  {
    id: 2,
    title: 'Mobile App for Health & Wellness',
    description: 'Developed a cross-platform mobile application to track fitness goals and promote healthy habits.',
    imageUrl: 'https://picsum.photos/600/400?random=3',
    aiHint: 'fitness app',
    tags: ['Mobile App', 'Health', 'React Native'],
    liveLink: '#',
  },
  {
    id: 3,
    title: 'Data Visualization Dashboard',
    description: 'Designed and built an interactive dashboard for complex data analysis and real-time reporting.',
    imageUrl: 'https://picsum.photos/600/400?random=4',
    aiHint: 'data dashboard',
    tags: ['Data Science', 'Web App', 'Analytics'],
    liveLink: '#',
  },
];

export function OurWorkSection() {
  return (
    <section id="our-work-section" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Our Portfolio
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A glimpse into some of the successful projects we&apos;ve delivered.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 w-full">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={project.aiHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{project.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags.map(tag => (
                        <span key={tag} className="text-xs bg-accent/20 text-accent-foreground py-1 px-2 rounded-full">{tag}</span>
                    ))}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{project.description}</CardDescription>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild variant="outline" className="w-full">
                  <Link href={project.liveLink} target="_blank" rel="noopener noreferrer">
                    View Project <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
