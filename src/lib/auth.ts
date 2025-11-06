import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import * as bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  debug: false,
  logger: {
    error(code, metadata: unknown) {
      // Suppress JWT_SESSION_ERROR when it's a decryption error
      if (code === 'JWT_SESSION_ERROR' && 
          typeof metadata === 'object' && 
          metadata !== null && 
          'message' in metadata && 
          typeof (metadata as { message?: unknown }).message === 'string' && 
          (metadata as { message: string }).message.includes('decryption')) {
        return; // Don't log JWT decryption errors
      }
      
      // Suppress Next.js dynamic server usage warnings (expected for authenticated pages)
      if (typeof metadata === 'object' && 
          metadata !== null && 
          'description' in metadata && 
          typeof (metadata as { description?: unknown }).description === 'string' && 
          ((metadata as { description: string }).description.includes('Dynamic server usage') ||
           (metadata as { description: string }).description.includes('couldn\'t be rendered statically'))) {
        return; // Don't log expected dynamic rendering warnings
      }
      
      console.error('[auth]', code, metadata);
    },
    warn(code) {
      console.warn('[auth]', code);
    },
    debug(code, metadata) {
      console.log('[auth]', code, metadata);
    },
  },
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email },
          include: { department: true }
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { 
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          theme: user.theme || "light"
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.theme = user.theme || "light";
      }
      
      // Re-fetch theme from database on session update or refresh
      if (token.id && (trigger === "update" || !user)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { theme: true },
        });
        if (dbUser?.theme) {
          token.theme = dbUser.theme;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId ?? null;
        session.user.theme = token.theme || "light";
      }
      return session;
    },
  },
};
