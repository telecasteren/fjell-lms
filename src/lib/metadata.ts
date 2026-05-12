import { Metadata } from "next";
import { defaultBranding } from "./branding";

export function generatePageMetadata(
  title: string,
  description?: string,
  keywords?: string[],
): Metadata {
  return {
    title,
    description: description || defaultBranding.appDescription,
    keywords: keywords?.join(", "),
    icons: {
      icon: defaultBranding.logo.favicon,
      shortcut: defaultBranding.logo.favicon,
      apple: defaultBranding.logo.favicon,
    },
  };
}

// Predefined metadata for common pages
export const pageMetadata = {
  dashboard: generatePageMetadata(
    "Dashboard",
    "Your learning dashboard with course progress and statistics",
    ["dashboard", "progress", "learning", "courses"],
  ),
  courses: generatePageMetadata(
    "Courses",
    "Browse and enroll in available courses",
    ["courses", "learning", "enrollment", "education"],
  ),
  profile: generatePageMetadata(
    "Profile",
    "Manage your profile and account settings",
    ["profile", "settings", "account", "user"],
  ),
  admin: generatePageMetadata(
    "Admin Dashboard",
    "Administrative dashboard for user and department management",
    ["admin", "management", "users", "departments"],
  ),
  author: generatePageMetadata(
    "Author Dashboard",
    "Course creation and content management dashboard",
    ["author", "courses", "content", "creation"],
  ),
  reports: generatePageMetadata(
    "Reports",
    "Department analytics and progress reports",
    ["reports", "analytics", "progress", "statistics"],
  ),
  signIn: generatePageMetadata("Sign In", "Sign in to your FJELL-LMS account", [
    "sign in",
    "login",
    "authentication",
  ]),
  signUp: generatePageMetadata("Sign Up", "Create a new FJELL-LMS account", [
    "sign up",
    "register",
    "create account",
  ]),
} as const;
