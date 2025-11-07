"use client";

import { BrandingSettings } from "@/components/branding/branding-settings";
import { ThemePreview } from "@/components/branding/theme-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, Eye, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BrandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const dashboardPath = session?.user?.role === "AUTHOR" ? "/author" : "/";

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push(dashboardPath)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Branding & Customization</h1>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="preview">
          <ThemePreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
