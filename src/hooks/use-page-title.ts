"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageTitles, setPageTitle } from "@/lib/page-titles";

export function usePageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    // Map pathname to page title
    const pathToTitle: Record<string, keyof typeof pageTitles> = {
      "/": "dashboard",
      "/courses": "courses",
      "/profile": "profile",
      "/admin": "admin",
      "/author": "author",
      "/reports": "reports",
      "/sign-in": "signIn",
      "/sign-up": "signUp",
    };

    // Handle dynamic routes
    if (pathname.startsWith("/courses/") && pathname.includes("/learn")) {
      setPageTitle("courses");
    } else if (pathname.startsWith("/courses/")) {
      setPageTitle("courses");
    } else {
      const pageKey = pathToTitle[pathname];
      if (pageKey) {
        setPageTitle(pageKey);
      }
    }
  }, [pathname]);
}
