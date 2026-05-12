"use client";

import { usePageTitle } from "@/hooks/use-page-title";

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  usePageTitle();
  return <>{children}</>;
}
