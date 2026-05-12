"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Save, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface DepartmentBrandingSettingsProps {
  departmentId: string;
  departmentName: string;
  currentLogoUrl?: string | null;
  currentLogoText?: string | null;
  currentAppDescription?: string | null;
  currentDarkModeLogoUrl?: string | null;
  currentFooterLinkSectionTitle?: string | null;
  currentFooterLink1Url?: string | null;
  currentFooterLink1Text?: string | null;
  currentFooterLink2Url?: string | null;
  currentFooterLink2Text?: string | null;
  currentFooterLink3Url?: string | null;
  currentFooterLink3Text?: string | null;
  currentFooterContactEmail?: string | null;
  currentFooterContactPhone?: string | null;
  currentFooterContactAddress?: string | null;
  currentFooterContactAddress2?: string | null;
}

export function DepartmentBrandingSettings({
  departmentId,
  currentLogoUrl,
  currentLogoText,
  currentAppDescription,
  currentDarkModeLogoUrl,
  currentFooterLinkSectionTitle,
  currentFooterLink1Url,
  currentFooterLink1Text,
  currentFooterLink2Url,
  currentFooterLink2Text,
  currentFooterLink3Url,
  currentFooterLink3Text,
  currentFooterContactEmail,
  currentFooterContactPhone,
  currentFooterContactAddress,
  currentFooterContactAddress2,
}: DepartmentBrandingSettingsProps) {
  const [logoText, setLogoText] = useState(currentLogoText || "FOX-LMS");
  const [appDescription, setAppDescription] = useState(
    currentAppDescription || "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    currentLogoUrl || null,
  );
  const [useSameLogoForDarkMode, setUseSameLogoForDarkMode] = useState(
    !currentDarkModeLogoUrl,
  );
  const [darkModeLogoFile, setDarkModeLogoFile] = useState<File | null>(null);
  const [darkModeLogoPreview, setDarkModeLogoPreview] = useState<string | null>(
    currentDarkModeLogoUrl || null,
  );
  // Footer fields
  const [footerLinkSectionTitle, setFooterLinkSectionTitle] = useState(
    currentFooterLinkSectionTitle || "",
  );
  const [footerLink1Url, setFooterLink1Url] = useState(
    currentFooterLink1Url || "",
  );
  const [footerLink1Text, setFooterLink1Text] = useState(
    currentFooterLink1Text || "",
  );
  const [footerLink2Url, setFooterLink2Url] = useState(
    currentFooterLink2Url || "",
  );
  const [footerLink2Text, setFooterLink2Text] = useState(
    currentFooterLink2Text || "",
  );
  const [footerLink3Url, setFooterLink3Url] = useState(
    currentFooterLink3Url || "",
  );
  const [footerLink3Text, setFooterLink3Text] = useState(
    currentFooterLink3Text || "",
  );
  const [footerContactEmail, setFooterContactEmail] = useState(
    currentFooterContactEmail || "",
  );
  const [footerContactPhone, setFooterContactPhone] = useState(
    currentFooterContactPhone || "",
  );
  const [footerContactAddress, setFooterContactAddress] = useState(
    currentFooterContactAddress || "",
  );
  const [footerContactAddress2, setFooterContactAddress2] = useState(
    currentFooterContactAddress2 || "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLogoText(currentLogoText || "FOX-LMS");
    setAppDescription(currentAppDescription || "");
    setLogoPreview(currentLogoUrl || null);
    setDarkModeLogoPreview(currentDarkModeLogoUrl || null);
    setUseSameLogoForDarkMode(!currentDarkModeLogoUrl);
    setFooterLinkSectionTitle(currentFooterLinkSectionTitle || "");
    setFooterLink1Url(currentFooterLink1Url || "");
    setFooterLink1Text(currentFooterLink1Text || "");
    setFooterLink2Url(currentFooterLink2Url || "");
    setFooterLink2Text(currentFooterLink2Text || "");
    setFooterLink3Url(currentFooterLink3Url || "");
    setFooterLink3Text(currentFooterLink3Text || "");
    setFooterContactEmail(currentFooterContactEmail || "");
    setFooterContactPhone(currentFooterContactPhone || "");
    setFooterContactAddress(currentFooterContactAddress || "");
    setFooterContactAddress2(currentFooterContactAddress2 || "");
  }, [
    currentLogoText,
    currentAppDescription,
    currentLogoUrl,
    currentDarkModeLogoUrl,
    currentFooterLinkSectionTitle,
    currentFooterLink1Url,
    currentFooterLink1Text,
    currentFooterLink2Url,
    currentFooterLink2Text,
    currentFooterLink3Url,
    currentFooterLink3Text,
    currentFooterContactEmail,
    currentFooterContactPhone,
    currentFooterContactAddress,
    currentFooterContactAddress2,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkModeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setDarkModeLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDarkModeLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleRemoveDarkModeLogo = () => {
    setDarkModeLogoFile(null);
    setDarkModeLogoPreview(null);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("departmentId", departmentId);
      formData.append("logoText", logoText);
      formData.append("appDescription", appDescription);
      formData.append(
        "useSameLogoForDarkMode",
        useSameLogoForDarkMode.toString(),
      );
      // Footer fields
      formData.append("footerLinkSectionTitle", footerLinkSectionTitle);
      formData.append("footerLink1Url", footerLink1Url);
      formData.append("footerLink1Text", footerLink1Text);
      formData.append("footerLink2Url", footerLink2Url);
      formData.append("footerLink2Text", footerLink2Text);
      formData.append("footerLink3Url", footerLink3Url);
      formData.append("footerLink3Text", footerLink3Text);
      formData.append("footerContactEmail", footerContactEmail);
      formData.append("footerContactPhone", footerContactPhone);
      formData.append("footerContactAddress", footerContactAddress);
      formData.append("footerContactAddress2", footerContactAddress2);

      if (logoFile) {
        formData.append("file", logoFile);
      }

      if (!useSameLogoForDarkMode && darkModeLogoFile) {
        formData.append("darkModeFile", darkModeLogoFile);
      }

      const res = await fetch("/api/departments/branding", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Department branding updated");
        setLogoFile(null);
        setDarkModeLogoFile(null);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update department branding");
      }
    } catch (error) {
      console.error("Error updating department branding:", error);
      toast.error("Failed to update department branding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section - All logo-related items together */}
        <div className="space-y-4">
          <Label>Logo Settings</Label>

          {/* Main Logo Layout: Text/Toggle on left, Logos on right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Side: Logo Text and Toggle */}
            <div className="space-y-4">
              {/* Logo Text */}
              <div className="space-y-2">
                <Label htmlFor="logo-text">Logo Text</Label>
                <Input
                  id="logo-text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  placeholder="FOX-LMS"
                />
                <p className="text-muted-foreground text-xs">
                  This text will appear next to your logo in the navbar and
                  footer
                </p>
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="app-description">Subtitle</Label>
                <Input
                  id="app-description"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Enter app description or subtitle"
                />
                <p className="text-muted-foreground text-xs">
                  A brief description or subtitle for your department
                </p>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Use same logo for dark theme
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    When enabled, the light theme logo will be used for dark
                    theme as well
                  </p>
                </div>
                <Switch
                  checked={useSameLogoForDarkMode}
                  onCheckedChange={(checked) => {
                    setUseSameLogoForDarkMode(checked);
                    if (checked) {
                      // Clear dark mode logo when toggling to use same logo
                      setDarkModeLogoFile(null);
                      setDarkModeLogoPreview(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Side: Logo Uploads */}
            <div className="space-y-4">
              {/* Logo Uploads Side by Side */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Light Mode Logo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Label className="text-sm font-medium">
                      Light Theme Logo
                    </Label>
                  </div>
                  {logoPreview ? (
                    <div className="relative inline-block h-32 w-32 rounded border">
                      <Image
                        src={logoPreview}
                        alt="Light mode logo preview"
                        fill
                        className="rounded object-contain"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed p-6 text-center">
                      <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-muted-foreground mb-2 text-sm">
                        No light theme logo uploaded (using default)
                      </p>
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? "Change Light Logo" : "Upload Light Logo"}
                    </Button>
                  </div>
                </div>

                {/* Dark Mode Logo - Only show if not using same logo */}
                {!useSameLogoForDarkMode && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <Label className="text-sm font-medium">
                        Dark Theme Logo
                      </Label>
                    </div>
                    {darkModeLogoPreview ? (
                      <div className="relative inline-block h-32 w-32 rounded border">
                        <Image
                          src={darkModeLogoPreview}
                          alt="Dark mode logo preview"
                          fill
                          className="rounded object-contain"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveDarkModeLogo}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed p-6 text-center">
                        <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                        <p className="text-muted-foreground mb-2 text-sm">
                          No dark theme logo uploaded
                        </p>
                      </div>
                    )}

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDarkModeFileChange}
                        className="hidden"
                        id="dark-logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("dark-logo-upload")?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {darkModeLogoPreview
                          ? "Change Dark Logo"
                          : "Upload Dark Logo"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Supported formats: PNG, JPG, SVG. Max size: 5MB
          </p>
        </div>

        {/* Footer Settings */}
        <div className="space-y-4 border-t pt-6">
          <Label className="text-base font-semibold">Footer Settings</Label>

          {/* Footer Link Section Title */}
          <div className="space-y-2">
            <Label htmlFor="footer-link-section-title">
              Link Section Title
            </Label>
            <Input
              id="footer-link-section-title"
              value={footerLinkSectionTitle}
              onChange={(e) => setFooterLinkSectionTitle(e.target.value)}
              placeholder="Title"
            />
            <p className="text-muted-foreground text-xs">
              Title for the footer links section
            </p>
          </div>

          {/* Footer Links */}
          <div className="space-y-4">
            <Label>Footer Links (up to 3)</Label>

            {/* Link 1 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="footer-link-1-text" className="text-xs">
                  Link 1 Text
                </Label>
                <Input
                  id="footer-link-1-text"
                  value={footerLink1Text}
                  onChange={(e) => setFooterLink1Text(e.target.value)}
                  placeholder="Link 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-link-1-url" className="text-xs">
                  Link 1 URL
                </Label>
                <Input
                  id="footer-link-1-url"
                  value={footerLink1Url}
                  onChange={(e) => setFooterLink1Url(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Link 2 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="footer-link-2-text" className="text-xs">
                  Link 2 Text
                </Label>
                <Input
                  id="footer-link-2-text"
                  value={footerLink2Text}
                  onChange={(e) => setFooterLink2Text(e.target.value)}
                  placeholder="Link 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-link-2-url" className="text-xs">
                  Link 2 URL
                </Label>
                <Input
                  id="footer-link-2-url"
                  value={footerLink2Url}
                  onChange={(e) => setFooterLink2Url(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Link 3 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="footer-link-3-text" className="text-xs">
                  Link 3 Text
                </Label>
                <Input
                  id="footer-link-3-text"
                  value={footerLink3Text}
                  onChange={(e) => setFooterLink3Text(e.target.value)}
                  placeholder="Link 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-link-3-url" className="text-xs">
                  Link 3 URL
                </Label>
                <Input
                  id="footer-link-3-url"
                  value={footerLink3Url}
                  onChange={(e) => setFooterLink3Url(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold">
              Contact Information
            </Label>
            <p className="text-muted-foreground text-xs">
              Contact information will be displayed in the footer
            </p>

            <div className="space-y-2">
              <Label htmlFor="footer-contact-email">Email</Label>
              <Input
                id="footer-contact-email"
                type="email"
                value={footerContactEmail}
                onChange={(e) => setFooterContactEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-contact-phone">Phone</Label>
              <Input
                id="footer-contact-phone"
                type="tel"
                value={footerContactPhone}
                onChange={(e) => setFooterContactPhone(e.target.value)}
                placeholder="+47 123 45 678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-contact-address">Address Line 1</Label>
              <Input
                id="footer-contact-address"
                value={footerContactAddress}
                onChange={(e) => setFooterContactAddress(e.target.value)}
                placeholder="Street Address, City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-contact-address2">Address Line 2</Label>
              <Input
                id="footer-contact-address2"
                value={footerContactAddress2}
                onChange={(e) => setFooterContactAddress2(e.target.value)}
                placeholder="Postal Code, Country"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Branding"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
