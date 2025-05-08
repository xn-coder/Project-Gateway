
"use client";

import * as _React from 'react'; // Workaround for "React refers to a UMD global"
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter, 
} from '@/components/ui/sidebar';
import { Briefcase, LayoutDashboard, ChevronLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: _React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  _React.useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/admin/signin') {
      router.push('/admin/signin');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  _React.useEffect(() => {
    // If on signin page and authenticated, redirect to admin dashboard
    if (isAuthenticated && pathname === '/admin/signin') {
      router.push('/admin');
    }
  }, [isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/admin/signin') {
    // This condition might be hit briefly before the useEffect redirect kicks in,
    // or if directly navigating to an admin page while not logged in.
    // Returning null or a loading indicator prevents rendering the layout for unauthenticated users.
    return null; 
  }
  
  // If on signin page and authenticated, the useEffect above will handle redirection.
  // Return null here to prevent rendering the sign-in page content if redirecting.
  if (isAuthenticated && pathname === '/admin/signin') {
    return null; 
  }


  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    // Add more admin navigation items here
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between p-2">
             <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                  Project Gateway
                </span>
             </Link>
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, className: "ml-2" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
            <div className="group-data-[collapsible=icon]:hidden space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back to Site
                  </Link>
                </Button>
                 <Button variant="destructive" className="w-full" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
            <div className="hidden group-data-[collapsible=icon]:flex flex-col space-y-2">
                 <Button variant="ghost" size="icon" asChild tooltip={{children: "Back to Site", side:"right"}}>
                     <Link href="/"><ChevronLeft/></Link>
                 </Button>
                 <Button variant="ghost" size="icon" onClick={logout} tooltip={{children: "Logout", side:"right"}} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <LogOut/>
                 </Button>
            </div>
          </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger/>
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </header>
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

