'use client'

import Link from "next/link";
import { useState } from "react";
import { useBrandingValue } from "@/components/providers/branding-provider";
import { FooterLogo } from "./logo";
import { ChevronUp, ChevronDown } from "lucide-react";

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentYear = new Date().getFullYear();
  const appName = useBrandingValue('appName');
  const appVersion = useBrandingValue('appVersion');
  const appDescription = useBrandingValue('appDescription');
  const links = useBrandingValue('links');
  const companyName = useBrandingValue('companyName');

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">    
            <FooterLogo className="w-6 h-6" />
            <h3 className="font-semibold text-sm text-foreground">{companyName}</h3>
            </div>
            <div className="text-xs text-muted-foreground">
            <p>{appDescription}</p>
            <p>Website: <a href={"https://" + links.homepage} className="hover:text-foreground transition-colors">{links.homepage}</a></p>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Products</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href={links.cubit} className="hover:text-foreground transition-colors">
                  Cubit
                </Link>
              </li>
              <li>
                <Link href={links.koti}  className="hover:text-foreground transition-colors">
                  Koti
                </Link>
              </li>
              <li>
                <Link href={links.sanako}  className="hover:text-foreground transition-colors">
                  Sanako
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Contact</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
                <a 
                  href={links.faq}
                  className="hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a 
                  href={links.contact}
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href={links.terms}
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-muted-foreground">
                © {currentYear} {appName}. All rights reserved.
              </div>
              <div className="text-xs text-muted-foreground">
                {appName} v{appVersion}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
