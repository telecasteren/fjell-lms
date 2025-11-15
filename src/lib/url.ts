/**
 * Get the base URL for the application
 * Uses NEXTAUTH_URL environment variable for server-side
 * For client-side, we need to get it from the server or use a public env var
 */
export function getBaseUrl(): string {
  // Server-side: use NEXTAUTH_URL from environment
  if (typeof window === "undefined") {
    return process.env.NEXTAUTH_URL || "https://fox-lms.no";
  }

  // Client-side: use NEXT_PUBLIC_APP_URL if set, otherwise use current origin
  // This allows overriding in production while still working in local dev
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback to current origin (for local development)
  return window.location.origin;
}

/**
 * Generate a sign-up URL with email and role parameters
 */
export function getSignUpUrl(email: string, role: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/sign-up?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
}
