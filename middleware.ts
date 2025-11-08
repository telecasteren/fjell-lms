import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isAuthRoute =
    nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  
  // Create response and set x-pathname header for layout to use
  const response = NextResponse.next();
  response.headers.set("x-pathname", nextUrl.pathname);

  // Skip auth checks for auth routes and API routes
  if (isApiAuth || isAuthRoute) {
    // Clear any stale NextAuth cookies on auth pages to prevent JWT errors
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    
    return response;
  }

  // Check for valid token on protected routes
  let token = null;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    // JWT decryption failed - likely old cookies with different secret
    // Clear cookies by redirecting to sign-in
    const signInUrl = new URL("/sign-in", nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to sign-in if no token
  if (!token) {
    const signInUrl = new URL("/sign-in", nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
