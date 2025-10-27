"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { storageManager } from "@/lib/storage";
import Image from "next/image";

interface DepartmentBrandingSettingsProps {
  departmentId: string;
  departmentName: string;
  currentLogoUrl?: string | null;
  currentLogoText?: string | null;
}

export function DepartmentBrandingSettings({
  departmentId,
  departmentName,
  currentLogoUrl,
  currentLogoText,
}: DepartmentBrandingSettingsProps) {
  const [logoText, setLogoText] = useState(currentLogoText || "FOX-LMS");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    currentLogoUrl || null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLogoText(currentLogoText || "FOX-LMS");
    setLogoPreview(currentLogoUrl || null);
  }, [currentLogoText, currentLogoUrl]);

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

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("departmentId", departmentId);
      formData.append("logoText", logoText);

      if (logoFile) {
        formData.append("file", logoFile);
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
          <Label>Logo Image</Label>

          {logoPreview ? (
            <div className="relative inline-block h-32 w-32 rounded border">
              <Image
                src={logoPreview}
                alt="Logo preview"
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
                No logo uploaded (using default)
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
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </Button>
          </div>

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
            onChange={e => setLogoText(e.target.value)}
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
