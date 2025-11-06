import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { ClientSessionProvider } from "@/components/client-session-provider";
import { Toaster } from "react-hot-toast";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/branding/footer";
import { CookieCleaner } from "@/components/cookie-cleaner";
import { defaultBranding } from "@/lib/branding";
import { PageTitleProvider } from "../components/page-title-provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: defaultBranding.appName,
    template: `%s | ${defaultBranding.appName}`,
  },
  description: defaultBranding.appDescription,
  icons: {
    icon: defaultBranding.logo.favicon,
    shortcut: defaultBranding.logo.favicon,
    apple: defaultBranding.logo.favicon,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  
  // Try to get session, but catch JWT decryption errors gracefully
  // Middleware already clears stale cookies on auth pages, so this should work
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    // JWT decryption failed - likely old cookies with different secret
    // Middleware clears these cookies, so just continue without session
    if (error instanceof Error) {
      // Ignore decryption errors (handled gracefully)
      if (error.message.includes('decryption')) {
        return;
      }
      // Ignore Next.js dynamic server usage warnings (expected for authenticated pages)
      if (error.message.includes('Dynamic server usage') || 
          error.message.includes('couldn\'t be rendered statically')) {
        return;
      }
      // Only log actual errors
      console.warn("Session error:", error);
    }
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href={defaultBranding.logo.favicon}
          type="image/svg+xml"
        />
        <link
          rel="shortcut icon"
          href={defaultBranding.logo.favicon}
          type="image/svg+xml"
        />
        <link rel="apple-touch-icon" href={defaultBranding.logo.favicon} />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
        style={{ fontFamily: "Tomatogrotesk, sans-serif" }}
      >
        <ClientSessionProvider session={session}>
          <CookieCleaner />
          <ThemeProvider>
            <BrandingProvider>
              <PageTitleProvider>
                <div className="flex min-h-dvh flex-col">
                  <div className="flex flex-1">
                    <Sidebar user={session?.user || null} />
                    <main className="flex-1 p-6 lg:ml-0">{children}</main>
                  </div>
                  <Footer />
                  <Toaster position="top-right" />
                </div>
              </PageTitleProvider>
            </BrandingProvider>
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
