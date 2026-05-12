"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/branding/logo";
import { UserAvatar } from "@/components/user-avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function Sidebar({ user: initialUser }: SidebarProps) {
  const { user, loading } = useCurrentUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Use fresh user data from database, fall back to initial user if loading
  const currentUser = user || initialUser;
  const userRole = currentUser?.role as Role | undefined;
  const canAccessAuthor = userRole
    ? hasPermission(userRole, "author:access")
    : false;
  const canAccessReports = userRole
    ? hasPermission(userRole, "reports:view")
    : false;
  const canAccessAdmin = userRole
    ? hasPermission(userRole, "admin:access")
    : false;

  // Auto-hide sidebar on mobile when navigating to different pages
  useEffect(() => {
    // Auto-hide sidebar on mobile when navigating
    // This will be handled by CSS media queries in the className
    setIsOpen(false);
  }, [pathname]);

  // Don't render sidebar if user is not authenticated
  if (!currentUser && !loading) {
    return null;
  }

  // Show loading state while checking authentication
  if (loading) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:block"}
        fixed lg:static inset-y-0 left-0 z-40
        w-64 lg:w-64 border-r bg-background p-4 space-y-4
        transition-transform duration-300 ease-in-out
        lg:transition-none
      `}
      >
        <Logo size="md" />
        <Separator />
        <nav className="grid gap-2">
          {canAccessAuthor ? (
            <Button variant="ghost" asChild>
              <Link href="/author">Dashboard</Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/">My dashboard</Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/courses">Courses</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/profile">Profile</Link>
          </Button>
          {canAccessReports && (
            <Button variant="ghost" asChild>
              <Link href="/reports">Reports</Link>
            </Button>
          )}
          {canAccessAdmin && (
            <Button variant="ghost" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/faq">FAQ</Link>
          </Button>
        </nav>
        {currentUser && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <UserAvatar user={currentUser} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {currentUser.name ?? currentUser.email}
                </div>
                <div className="text-xs text-muted-foreground">{userRole}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                signOut({
                  callbackUrl: "/sign-in",
                  redirect: true,
                })
              }
            >
              Sign out
            </Button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
