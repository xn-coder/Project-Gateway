
import Link from 'next/link';
import { Briefcase, Twitter, Linkedin, Github } from 'lucide-react';

export function MainFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center justify-center md:justify-start">
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold text-foreground">
                Project Gateway
              </span>
            </Link>
          </div>
          
          <div className="text-center text-muted-foreground">
            <p>&copy; {currentYear} Project Gateway. All rights reserved.</p>
            <p className="text-sm">
              Crafting digital excellence, one project at a time.
            </p>
          </div>

          <div className="flex justify-center md:justify-end space-x-4">
            <Link href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-6 w-6" />
            </Link>
            <Link href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="h-6 w-6" />
            </Link>
            <Link href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
