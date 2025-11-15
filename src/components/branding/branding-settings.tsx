"use client";

import React, { useState } from "react";
import {
  useBranding,
  useBrandingUpdater,
} from "@/components/providers/branding-provider";
import { BrandingConfig, brandingUtils } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import {
  Palette,
  Type,
  Link,
  Settings,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";

export function BrandingSettings() {
  const { branding } = useBranding();
  const updateBranding = useBrandingUpdater();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandingConfig>>(branding);

  const handleSave = () => {
    const errors = brandingUtils.validateBranding(formData);
    if (errors.length > 0) {
      toast.error(`Validation errors: ${errors.join(", ")}`);
      return;
    }

    updateBranding(formData);
    setIsEditing(false);
    toast.success("Branding settings updated successfully");
  };

  const handleReset = () => {
    setFormData(branding);
    setIsEditing(false);
    toast.success("Changes discarded");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(branding, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fox-lms-branding.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Branding configuration exported");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const errors = brandingUtils.validateBranding(imported);
        if (errors.length > 0) {
          toast.error(`Import validation errors: ${errors.join(", ")}`);
          return;
        }
        setFormData(imported);
        toast.success("Branding configuration imported");
      } catch {
        toast.error("Failed to parse imported file");
      }
    };
    reader.readAsText(file);
  };

  const updateFormData = (updates: Partial<BrandingConfig>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateColors = (
    colorKey: keyof BrandingConfig["colors"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      colors: {
        primary: prev.colors?.primary || "#3b82f6",
        secondary: prev.colors?.secondary || "#64748b",
        accent: prev.colors?.accent || "#f59e0b",
        success: prev.colors?.success || "#10b981",
        warning: prev.colors?.warning || "#f59e0b",
        error: prev.colors?.error || "#ef4444",
        background: prev.colors?.background || "#ffffff",
        foreground: prev.colors?.foreground || "#0f172a",
        [colorKey]: value,
      },
    }));
  };

  const updateFeatures = (
    featureKey: keyof BrandingConfig["features"],
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        enableDarkMode: prev.features?.enableDarkMode ?? false,
        enableNotifications: prev.features?.enableNotifications ?? false,
        enableAnalytics: prev.features?.enableAnalytics ?? false,
        enableFeedback: prev.features?.enableFeedback ?? false,
        [featureKey]: value,
      },
    }));
  };

  const updateTypography = (
    typographyKey: keyof BrandingConfig["typography"],
    value:
      | string
      | BrandingConfig["typography"]["fontWeights"]
      | BrandingConfig["typography"]["fontSizes"],
  ) => {
    setFormData((prev) => ({
      ...prev,
      typography: {
        fontFamily: prev.typography?.fontFamily || "Tomatogrotesk, sans-serif",
        fontWeights: prev.typography?.fontWeights || {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        fontSizes: prev.typography?.fontSizes || {
          xs: "0.75rem",
          sm: "0.875rem",
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem",
          "3xl": "1.875rem",
          "4xl": "2.25rem",
        },
        [typographyKey]: value,
      },
    }));
  };

  const updateFontWeight = (
    weightKey: keyof BrandingConfig["typography"]["fontWeights"],
    value: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      typography: {
        fontFamily: prev.typography?.fontFamily || "Tomatogrotesk, sans-serif",
        fontWeights: {
          normal: prev.typography?.fontWeights?.normal || 400,
          medium: prev.typography?.fontWeights?.medium || 500,
          semibold: prev.typography?.fontWeights?.semibold || 600,
          bold: prev.typography?.fontWeights?.bold || 700,
          [weightKey]: value,
        },
        fontSizes: prev.typography?.fontSizes || {
          xs: "0.75rem",
          sm: "0.875rem",
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem",
          "3xl": "1.875rem",
          "4xl": "2.25rem",
        },
      },
    }));
  };

  const updateLinks = (
    linkKey: keyof BrandingConfig["links"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        homepage: prev.links?.homepage || "https://www.telecasternilsen.com",
        contact:
          prev.links?.contact || "https://www.telecasternilsen.com/#contact",
        link1: prev.links?.link1 || "https://example.com/link1",
        link2: prev.links?.link2 || "https://example.com/link2",
        link3: prev.links?.link3 || "https://example.com/link3",
        terms: prev.links?.terms || "",
        faq: prev.links?.faq || "/faq",
        [linkKey]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding Settings</h2>
          <p className="text-muted-foreground">
            Customize the appearance and behavior of your FOX-LMS instance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <label className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Identity</CardTitle>
              <CardDescription>
                Basic information about your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={formData.appName || ""}
                    onChange={(e) =>
                      updateFormData({ appName: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appVersion">Version</Label>
                  <Input
                    id="appVersion"
                    value={formData.appVersion || ""}
                    onChange={(e) =>
                      updateFormData({ appVersion: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appDescription">Description</Label>
                <Input
                  id="appDescription"
                  value={formData.appDescription || ""}
                  onChange={(e) =>
                    updateFormData({ appDescription: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-muted-foreground text-sm">
                        Enable dark theme support
                      </p>
                    </div>
                    <Switch
                      checked={formData.features?.enableDarkMode ?? false}
                      onCheckedChange={(checked: boolean) =>
                        updateFeatures("enableDarkMode", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Enable push notifications
                      </p>
                    </div>
                    <Switch
                      checked={formData.features?.enableNotifications ?? false}
                      onCheckedChange={(checked: boolean) =>
                        updateFeatures("enableNotifications", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics</Label>
                      <p className="text-muted-foreground text-sm">
                        Enable usage analytics
                      </p>
                    </div>
                    <Switch
                      checked={formData.features?.enableAnalytics ?? false}
                      onCheckedChange={(checked: boolean) =>
                        updateFeatures("enableAnalytics", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize the color palette for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={formData.colors?.primary || "#3b82f6"}
                      onChange={(e) => updateColors("primary", e.target.value)}
                      disabled={!isEditing}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={formData.colors?.primary || "#3b82f6"}
                      onChange={(e) => updateColors("primary", e.target.value)}
                      disabled={!isEditing}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={formData.colors?.secondary || "#64748b"}
                      onChange={(e) =>
                        updateColors("secondary", e.target.value)
                      }
                      disabled={!isEditing}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={formData.colors?.secondary || "#64748b"}
                      onChange={(e) =>
                        updateColors("secondary", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="#64748b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={formData.colors?.accent || "#f59e0b"}
                      onChange={(e) => updateColors("accent", e.target.value)}
                      disabled={!isEditing}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={formData.colors?.accent || "#f59e0b"}
                      onChange={(e) => updateColors("accent", e.target.value)}
                      disabled={!isEditing}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success">Success Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="success"
                      type="color"
                      value={formData.colors?.success || "#10b981"}
                      onChange={(e) => updateColors("success", e.target.value)}
                      disabled={!isEditing}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={formData.colors?.success || "#10b981"}
                      onChange={(e) => updateColors("success", e.target.value)}
                      disabled={!isEditing}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge style={{ backgroundColor: formData.colors?.primary }}>
                  Primary
                </Badge>
                <Badge style={{ backgroundColor: formData.colors?.secondary }}>
                  Secondary
                </Badge>
                <Badge style={{ backgroundColor: formData.colors?.accent }}>
                  Accent
                </Badge>
                <Badge style={{ backgroundColor: formData.colors?.success }}>
                  Success
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Configure fonts and text styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={
                    formData.typography?.fontFamily ||
                    "Tomatogrotesk, sans-serif"
                  }
                  onChange={(e) =>
                    updateTypography("fontFamily", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="Tomatogrotesk, sans-serif"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontWeightNormal">Normal Weight</Label>
                  <Input
                    id="fontWeightNormal"
                    type="number"
                    value={formData.typography?.fontWeights?.normal || 400}
                    onChange={(e) =>
                      updateFontWeight("normal", parseInt(e.target.value))
                    }
                    disabled={!isEditing}
                    min="100"
                    max="900"
                    step="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontWeightBold">Bold Weight</Label>
                  <Input
                    id="fontWeightBold"
                    type="number"
                    value={formData.typography?.fontWeights?.bold || 700}
                    onChange={(e) =>
                      updateFontWeight("bold", parseInt(e.target.value))
                    }
                    disabled={!isEditing}
                    min="100"
                    max="900"
                    step="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="space-y-2 rounded-md border p-4">
                  <h1 style={{ fontFamily: formData.typography?.fontFamily }}>
                    Heading 1 - {formData.appName}
                  </h1>
                  <h2 style={{ fontFamily: formData.typography?.fontFamily }}>
                    Heading 2 - Application Description
                  </h2>
                  <p style={{ fontFamily: formData.typography?.fontFamily }}>
                    This is a preview of how your text will appear with the
                    selected font family.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links and URLs</CardTitle>
              <CardDescription>
                Configure external links and references
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homepage">Homepage URL</Label>
                  <Input
                    id="homepage"
                    value={formData.links?.homepage || ""}
                    onChange={(e) => updateLinks("homepage", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://fox-lms.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
