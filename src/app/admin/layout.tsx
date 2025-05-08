"use client";

import *_React from 'react'; // Workaround for "React refers to a UMD global"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Briefcase, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: _React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    // Add more admin navigation items here
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between p-2">
             <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
         <div className="p-4 border-t group-data-[collapsible=icon]:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Site
              </Link>
            </Button>
          </div>
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
