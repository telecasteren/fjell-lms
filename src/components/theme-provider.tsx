"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
};

export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  const { data: session } = useSession();
  
  // Get theme from session if available
  const userTheme = (session?.user && typeof session.user === 'object' && session.user !== null && 'theme' in session.user 
    ? (session.user as { theme?: string }).theme 
    : undefined) || defaultTheme;
  
  // Use user-specific storage key to prevent theme bleeding between users
  const storageKey = session?.user?.id 
    ? `fox-lms-theme-${session.user.id}` 
    : "fox-lms-theme-guest";
  
  // Force theme sync when session changes
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Force apply theme immediately when user changes or theme preference changes
    if (userTheme && typeof window !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(userTheme);
    }
  }, [userTheme]);
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }
  
  return (
    <NextThemesProvider 
      attribute="class" 
      forcedTheme={userTheme}
      enableSystem={false}
      storageKey={storageKey}
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  );
}


