"use client";

import React, { useState, useEffect } from "react";
import { useBrandingValue } from "@/components/providers/branding-provider";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  xxl: "h-20 w-20",
  xxxl: "h-24 w-24",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function Logo({
  className,
  size = "md",
  showText = true,
  textClassName,
}: LogoProps) {
  const logo = useBrandingValue("logo");
  const { data: session, status: sessionStatus } = useSession();
  const [departmentBranding, setDepartmentBranding] = useState<{
    logoUrl?: string;
    darkModeLogoUrl?: string;
    logoText?: string;
  } | null>(null);

  // Fetch department branding on mount
  useEffect(() => {
    // Only fetch if session is authenticated (not loading, not unauthenticated)
    if (sessionStatus !== "authenticated" || !session?.user) {
      setDepartmentBranding(null);
      return;
    }

    async function fetchDepartmentBranding() {
      try {
        const res = await fetch("/api/departments/current", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.department) {
            setDepartmentBranding({
              logoUrl: data.department.logoUrl,
              darkModeLogoUrl: data.department.darkModeLogoUrl,
              logoText: data.department.logoText,
            });
          }
        } else {
          // Handle any non-200 response (401, 403, 500, etc.) - use default branding
          console.warn(
            "Failed to fetch department branding:",
            res.status,
            res.statusText,
          );
          setDepartmentBranding(null);
        }
      } catch (error) {
        console.error("Failed to fetch department branding:", error);
        // Use default branding on error
        setDepartmentBranding(null);
      }
    }

    fetchDepartmentBranding();
  }, [session, sessionStatus]);

  // Determine which logo URL to use
  const logoUrl = departmentBranding?.logoUrl || logo.light;
  const logoTextDisplay = departmentBranding?.logoText || "FOX-LMS";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        {/* Use department logo if available, otherwise use default */}
        {departmentBranding?.logoUrl ? (
          <>
            {/* Light theme logo */}
            <Image
              src={logoUrl}
              alt={logo.alt}
              fill
              sizes="(max-width: 768px) 24px, 64px"
              className="object-contain dark:hidden"
              unoptimized
            />
            {/* Dark theme logo - use darkModeLogoUrl if available, otherwise use same logo or default */}
            <Image
              src={departmentBranding.darkModeLogoUrl || logoUrl}
              alt={logo.alt}
              fill
              sizes="(max-width: 768px) 24px, 64px"
              className="hidden object-contain dark:block"
              unoptimized
            />
          </>
        ) : (
          <>
            {/* Light theme logo */}
            <Image
              src={logo.light}
              alt={logo.alt}
              fill
              sizes="(max-width: 768px) 24px, 64px"
              className="object-contain dark:hidden"
              priority
            />
            {/* Dark theme logo */}
            <Image
              src={logo.dark}
              alt={logo.alt}
              fill
              sizes="(max-width: 768px) 24px, 64px"
              className="hidden object-contain dark:block"
              priority
            />
          </>
        )}
      </div>
      {showText && (
        <span
          className={cn(
            "text-foreground font-bold",
            textSizeClasses[size],
            textClassName,
          )}
        >
          {logoTextDisplay}
        </span>
      )}
    </div>
  );
}

// Simple logo without text
export function LogoIcon({
  className,
  size = "md",
}: Omit<LogoProps, "showText" | "textClassName">) {
  return <Logo className={className} size={size} showText={false} />;
}

// Logo with custom text
interface LogoWithTextProps extends LogoProps {
  text: string;
}

export function LogoWithText({
  className,
  size = "md",
  text,
  textClassName,
}: LogoWithTextProps) {
  const logo = useBrandingValue("logo");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        {/* Light theme logo */}
        <Image
          src={logo.light}
          alt={logo.alt}
          fill
          sizes="(max-width: 768px) 24px, 64px"
          className="object-contain dark:hidden"
          priority
        />
        {/* Dark theme logo */}
        <Image
          src={logo.dark}
          alt={logo.alt}
          fill
          sizes="(max-width: 768px) 24px, 64px"
          className="hidden object-contain dark:block"
          priority
        />
      </div>
      <span
        className={cn(
          "text-foreground font-bold",
          textSizeClasses[size],
          textClassName,
        )}
      >
        {text}
      </span>
    </div>
  );
}

// Department-specific logo
interface DepartmentLogoProps extends LogoProps {
  departmentName: string;
}

export function DepartmentLogo({
  className,
  size = "md",
  departmentName,
  textClassName,
}: DepartmentLogoProps) {
  return (
    <LogoWithText
      className={className}
      size={size}
      text={departmentName}
      textClassName={textClassName}
    />
  );
}

// Footer logo (smaller, no text)
export function FooterLogo({ className }: { className?: string }) {
  return <LogoIcon className={className} size="sm" />;
}

// Header logo (medium with text)
export function HeaderLogo({ className }: { className?: string }) {
  return <Logo className={className} size="md" />;
}

// Loading logo (large, centered)
export function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Logo size="xl" />
    </div>
  );
}
