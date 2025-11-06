'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { useBrandingValue } from "@/components/providers/branding-provider";
import { FooterLogo } from "./logo";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

interface DepartmentFooterData {
  logoText?: string | null;
  footerLinkSectionTitle?: string | null;
  footerLink1Url?: string | null;
  footerLink1Text?: string | null;
  footerLink2Url?: string | null;
  footerLink2Text?: string | null;
  footerLink3Url?: string | null;
  footerLink3Text?: string | null;
  footerContactEmail?: string | null;
  footerContactPhone?: string | null;
  footerContactAddress?: string | null;
  footerContactAddress2?: string | null;
}

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [departmentFooterData, setDepartmentFooterData] = useState<DepartmentFooterData | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const currentYear = new Date().getFullYear();
  const appName = useBrandingValue('appName');
  const appVersion = useBrandingValue('appVersion');
  const appDescription = useBrandingValue('appDescription');
  const links = useBrandingValue('links');

  // Fetch department footer data
  useEffect(() => {
    // Only fetch if session is authenticated (not loading, not unauthenticated)
    if (sessionStatus !== "authenticated" || !session?.user) {
      setDepartmentFooterData(null);
      return;
    }

    async function fetchDepartmentFooterData() {
      try {
        const res = await fetch("/api/departments/current", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.department) {
            setDepartmentFooterData({
              logoText: data.department.logoText,
              footerLinkSectionTitle: data.department.footerLinkSectionTitle,
              footerLink1Url: data.department.footerLink1Url,
              footerLink1Text: data.department.footerLink1Text,
              footerLink2Url: data.department.footerLink2Url,
              footerLink2Text: data.department.footerLink2Text,
              footerLink3Url: data.department.footerLink3Url,
              footerLink3Text: data.department.footerLink3Text,
              footerContactEmail: data.department.footerContactEmail,
              footerContactPhone: data.department.footerContactPhone,
              footerContactAddress: data.department.footerContactAddress,
              footerContactAddress2: data.department.footerContactAddress2,
            });
          }
        } else {
          // Handle any non-200 response (401, 403, 500, etc.) - use default branding
          console.warn("Failed to fetch department footer data:", res.status, res.statusText);
          setDepartmentFooterData(null);
        }
      } catch (error) {
        console.error("Failed to fetch department footer data:", error);
        // Use default branding on error
        setDepartmentFooterData(null);
      }
    }

    fetchDepartmentFooterData();
  }, [session, sessionStatus]);

  // Get logo text (use department-specific or default)
  const logoText = departmentFooterData?.logoText || appName;
  
  // Get link section title (use department-specific or default)
  const linkSectionTitle = departmentFooterData?.footerLinkSectionTitle || "Products";
  
  // Build footer links array from department data
  const footerLinks = [];
  if (departmentFooterData?.footerLink1Url && departmentFooterData?.footerLink1Text) {
    footerLinks.push({ url: departmentFooterData.footerLink1Url, text: departmentFooterData.footerLink1Text });
  }
  if (departmentFooterData?.footerLink2Url && departmentFooterData?.footerLink2Text) {
    footerLinks.push({ url: departmentFooterData.footerLink2Url, text: departmentFooterData.footerLink2Text });
  }
  if (departmentFooterData?.footerLink3Url && departmentFooterData?.footerLink3Text) {
    footerLinks.push({ url: departmentFooterData.footerLink3Url, text: departmentFooterData.footerLink3Text });
  }

  // Use default links if no department-specific links are set
  const displayLinks = footerLinks.length > 0 
    ? footerLinks 
    : [
        { url: links.cubit, text: "Cubit" },
        { url: links.koti, text: "Koti" },
        { url: links.sanako, text: "Sanako" },
      ];

  return (
    <footer className="border-t bg-muted/50">
      {/* Toggle Button */}
      <div className="flex justify-center py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Hide Info
            </>
          ) : (
            <>
              <ChevronUp className="h-3 w-3" />
              Show Info
            </>
          )}
        </button>
      </div>

      {/* Footer Content */}
      {isExpanded && (
        <div className="container mx-auto px-4 pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">    
                <FooterLogo className="w-6 h-6" />
                <h3 className="font-semibold text-sm text-foreground">{logoText}</h3>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{appDescription}</p>
                <p>Website: <a href={"https://" + links.homepage} className="hover:text-foreground transition-colors">{links.homepage}</a></p>
              </div>
            </div>

            {/* Links Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">{linkSectionTitle}</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {displayLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.url} className="hover:text-foreground transition-colors">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Contact</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {departmentFooterData?.footerContactEmail && (
                  <li>
                    <a 
                      href={`mailto:${departmentFooterData.footerContactEmail}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {departmentFooterData.footerContactEmail}
                    </a>
                  </li>
                )}
                {departmentFooterData?.footerContactPhone && (
                  <li>
                    <a 
                      href={`tel:${departmentFooterData.footerContactPhone}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {departmentFooterData.footerContactPhone}
                    </a>
                  </li>
                )}
                {departmentFooterData?.footerContactAddress && (
                  <li className="text-muted-foreground">
                    {departmentFooterData.footerContactAddress}
                  </li>
                )}
                {departmentFooterData?.footerContactAddress2 && (
                  <li className="text-muted-foreground">
                    {departmentFooterData.footerContactAddress2}
                  </li>
                )}
                {!departmentFooterData?.footerContactEmail && 
                 !departmentFooterData?.footerContactPhone && 
                 !departmentFooterData?.footerContactAddress &&
                 !departmentFooterData?.footerContactAddress2 && (
                  <li>
                    <a 
                      href={links.faq}
                      className="hover:text-foreground transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-muted-foreground">
                © {currentYear} FOX-LMS. All rights reserved.
              </div>
              <div className="text-xs text-muted-foreground">
                FOX-LMS v{appVersion}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
