"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useDashboardRefresh() {
  const router = useRouter();

  const refreshDashboard = useCallback(() => {
    // Trigger a soft refresh of the current page
    router.refresh();
  }, [router]);

  const refreshAllDashboards = useCallback(() => {
    // Dispatch custom event to notify all dashboard components
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    
    // Also trigger a router refresh for server components
    router.refresh();
  }, [router]);

  return {
    refreshDashboard,
    refreshAllDashboards,
  };
}