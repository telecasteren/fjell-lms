"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Session } from "next-auth";

interface ClientSessionProviderProps {
  children: ReactNode;
  session: Session | null;
}

export function ClientSessionProvider({
  children,
  session,
}: ClientSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
