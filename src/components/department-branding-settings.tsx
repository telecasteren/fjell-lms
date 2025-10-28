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
  currentDarkModeLogoUrl?: string | null;
}

export function DepartmentBrandingSettings({
  departmentId,
  departmentName,
  currentLogoUrl,
  currentLogoText,
  currentDarkModeLogoUrl,
}: DepartmentBrandingSettingsProps) {
  const [logoText, setLogoText] = useState(currentLogoText || "FOX-LMS");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    currentLogoUrl || null
  );
  const [useSameLogoForDarkMode, setUseSameLogoForDarkMode] = useState(
    !currentDarkModeLogoUrl
  );
  const [darkModeLogoFile, setDarkModeLogoFile] = useState<File | null>(null);
  const [darkModeLogoPreview, setDarkModeLogoPreview] = useState<string | null>(
    currentDarkModeLogoUrl || null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLogoText(currentLogoText || "FOX-LMS");
    setLogoPreview(currentLogoUrl || null);
    setDarkModeLogoPreview(currentDarkModeLogoUrl || null);
    setUseSameLogoForDarkMode(!currentDarkModeLogoUrl);
  }, [currentLogoText, currentLogoUrl, currentDarkModeLogoUrl]);

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
      formData.append(
        "useSameLogoForDarkMode",
        useSameLogoForDarkMode.toString()
      );

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
        toast.success(
          data.message || "Department branding updated successfully"
        );
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
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label>Logo Images</Label>

          {/* Light Mode Logo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Label className="text-sm font-medium">Light Theme Logo</Label>
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
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {logoPreview ? "Change Light Logo" : "Upload Light Logo"}
              </Button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Use same logo for dark theme
              </Label>
              <p className="text-muted-foreground text-xs">
                When enabled, the light theme logo will be used for dark theme
                as well
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

          {/* Dark Mode Logo - Only show if not using same logo */}
          {!useSameLogoForDarkMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label className="text-sm font-medium">Dark Theme Logo</Label>
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

          <p className="text-muted-foreground text-xs">
            Supported formats: PNG, JPG, SVG. Max size: 5MB
          </p>
        </div>

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
            This text will appear next to your logo in the navbar
          </p>
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
