import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// CSRF protection middleware
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  // Skip CSRF validation for GET requests
  if (request.method === "GET") {
    return true;
  }

  // Skip CSRF validation for NextAuth API routes
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return true;
  }

  // Get the CSRF token from headers
  const csrfToken = request.headers.get("x-csrf-token");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Validate origin/referer
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
    "https://localhost:3000",
  ].filter(Boolean);

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    console.warn("CSRF: Invalid origin", { requestOrigin, allowedOrigins });
    return false;
  }

  // For authenticated requests, validate the session
  if (csrfToken) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        console.warn("CSRF: No valid session token");
        return false;
      }
    } catch {
      console.warn("CSRF: Token validation failed", error);
      return false;
    }
  }

  return true;
}

// Helper function to add CSRF headers to responses
export function addCSRFHeaders(response: Response): Response {
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Add CSP header for additional protection
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

// CSRF middleware wrapper
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>
): Promise<Response> {
  const isValid = await validateCSRF(request);

  if (!isValid) {
    return new Response(JSON.stringify({ error: "CSRF validation failed" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const response = await handler(request);
  return addCSRFHeaders(response);
}
