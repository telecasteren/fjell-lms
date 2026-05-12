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
    const userId = session?.user?.id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return user;
    }
    if (!session?.user?.email) return null;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    return user;
  }

  // For API routes, use getToken
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch (error) {
    console.error("getCurrentUser: Error getting token", error);
    return null;
  }

  if (!token) {
    console.log("getCurrentUser: No token found");
    return null;
  }

  console.log("getCurrentUser: Token found", {
    hasId: !!token.id,
    hasEmail: !!token.email,
    role: token.role,
  });

  // Use ID from token if available, otherwise fall back to email
  if (token?.id) {
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });
    if (!user) {
      console.log("getCurrentUser: User not found for token.id", token.id);
    } else {
      console.log("getCurrentUser: User found", {
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
    return user;
  }
  if (!token?.email) {
    console.log("getCurrentUser: No email in token");
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { email: token.email as string },
  });
  if (!user) {
    console.log("getCurrentUser: User not found for token.email", token.email);
  } else {
    console.log("getCurrentUser: User found", {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
  return user;
}
