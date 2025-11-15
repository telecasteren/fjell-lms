"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CookieCleaner() {
  const router = useRouter();

  useEffect(() => {
    // Clear all NextAuth cookies on page load
    const clearCookies = () => {
      const cookies = [
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
        "__Secure-next-auth.session-token",
        "__Host-next-auth.csrf-token",
      ];

      cookies.forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      });
    };

    // Clear cookies on sign-in and sign-up pages to ensure clean state
    if (
      window.location.pathname === "/sign-in" ||
      window.location.pathname === "/sign-up"
    ) {
      clearCookies();
    }

    // Check if we're on the error page
    if (
      window.location.pathname === "/api/auth/signin" &&
      window.location.search.includes("error=CredentialsSignin")
    ) {
      clearCookies();
      router.push("/sign-in");
    }
  }, [router]);

  return null;
}
