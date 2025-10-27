import { defaultBranding } from "./branding";

export const pageTitles = {
  dashboard: "Dashboard",
  courses: "Courses",
  profile: "Profile",
  admin: "Admin Dashboard",
  author: "Author Dashboard",
  reports: "Reports",
  signIn: "Sign In",
  signUp: "Sign Up",
} as const;

export function getPageTitle(page: keyof typeof pageTitles): string {
  return `${pageTitles[page]} | ${defaultBranding.appName}`;
}

export function setPageTitle(page: keyof typeof pageTitles): void {
  if (typeof window !== "undefined") {
    document.title = getPageTitle(page);
  }
}
