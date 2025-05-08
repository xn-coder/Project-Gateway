import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Project Gateway
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Add navigation items here if needed in the future */}
        </nav>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
