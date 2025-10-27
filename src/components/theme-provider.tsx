"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSession } from "next-auth/react";
import * as React from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
};

export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  const { data: session } = useSession();
  
  // Get theme from session if available
  const userTheme = (session?.user as any)?.theme || defaultTheme;
  
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme={userTheme} 
      enableSystem={false}
      storageKey="fox-lms-theme"
    >
      {children}
    </NextThemesProvider>
  );
}


