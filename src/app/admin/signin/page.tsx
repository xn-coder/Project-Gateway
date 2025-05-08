
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, LogIn } from 'lucide-react';

export default function AdminSignInPage() {
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(password);
    if (success) {
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      router.push('/admin');
    } else {
      toast({ title: 'Login Failed', description: 'Invalid password.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
         <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading authentication status...</p>
        </div>
      </div>
    );
  }


  // If already authenticated and not loading, this page shouldn't be accessible,
  // but the effect in AuthProvider should handle redirection.
  // A client-side check here is an additional safeguard.
  if (isAuthenticated) {
     // This will likely not be seen as the redirect in AuthProvider or the useEffect above will trigger first.
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <p className="text-muted-foreground">Already authenticated. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="flex items-center gap-2 mb-8">
          <Briefcase className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Project Gateway - Admin</span>
        </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your password to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter admin password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Signing In...' : <> <LogIn className="mr-2 h-4 w-4" /> Sign In </>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
