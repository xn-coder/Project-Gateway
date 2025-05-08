
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Project Gateway',
  description: 'Submit your project requirements easily and efficiently.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
