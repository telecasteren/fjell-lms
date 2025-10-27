import { getToken } from "next-auth/jwt";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

export async function getCurrentUser(req?: NextRequest) {
  if (!req) {
    // Fallback for non-API contexts (like server components)
    const { getServerSession } = await import("next-auth");
    const session = await getServerSession(authOptions);
    // Use ID if available, otherwise fall back to email
    const userId = (session?.user as any)?.id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return user;
    }
    if (!session?.user?.email) return null;
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user;
  }
  
  // For API routes, use getToken
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // Use ID from token if available, otherwise fall back to email
  if (token?.id) {
    const user = await prisma.user.findUnique({ where: { id: token.id as string } });
    return user;
  }
  if (!token?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: token.email as string } });
  return user;
}


