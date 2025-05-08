
"use client";

import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a placeholder for a real password check.
// In a real application, this should be handled securely on the server-side.
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "adminpassword"; 

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for stored auth state (e.g., in localStorage)
    // For this example, we'll just initialize it as not authenticated.
    // In a real app, you might check a token or session.
    const storedAuthState = localStorage.getItem('isAdminAuthenticated');
    if (storedAuthState === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call for password check
    await new Promise(resolve => setTimeout(resolve, 500)); 
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      setIsLoading(false);
      return true;
    }
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/signin');
  };

  // Route protection logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/signin') {
      router.push('/admin/signin');
    }
  }, [isAuthenticated, isLoading, pathname, router]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
