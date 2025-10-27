"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  departmentId: string;
}

export function useCurrentUser() {
  const { data: session, update } = useSession();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/session", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [session?.user?.id, session?.user?.email]);

  const refreshUser = async () => {
    setLoading(true);
    await fetchUser();
  };

  return {
    user,
    loading,
    refreshUser,
    updateSession: update,
  };
}
