"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { Pencil, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    departmentId: string;
    image?: string | null;
    createdAt: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
  stats: {
    totalCourses: number;
    completedCourses: number;
    overallCompletion: number;
  };
  recentActivity: Array<{
    id: string;
    courseTitle: string;
    completedLessons: number;
  }>;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null | undefined>(
    null,
  );
  const [avatarImageError, setAvatarImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm({
    defaultValues: { name: "" },
  });

  const emailForm = useForm({
    defaultValues: { email: "" },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadProfileData();
    };

    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
  }, []);

  useEffect(() => {
    if (profileData?.user) {
      profileForm.setValue("name", profileData.user.name || "");
      emailForm.setValue("email", profileData.user.email || "");
      setAvatarImage(profileData.user.image || null);
      setAvatarImageError(false); // Reset error when user data changes
    }
  }, [profileData, profileForm, emailForm]);

  const loadProfileData = async () => {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        toast.error("Failed to load profile data");
      }
    } catch {
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: { name: string }) => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.ok) {
        const result = await res.json();
        setProfileData((prev) =>
          prev ? { ...prev, user: result.user } : null,
        );
        await update({
          ...session,
          user: {
            ...session?.user,
            name: result.user.name,
          },
        });
        window.location.reload();
        toast.success("Profile updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleEmailChange = async (data: { email: string }) => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Email updated successfully");
        emailForm.reset();
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                user: { ...prev.user, email: data.email },
              }
            : null,
        );
        await update({
          ...session,
          user: {
            ...session?.user,
            email: data.email,
          },
        });
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update email");
      }
    } catch {
      toast.error("Failed to update email");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    // Prevent duplicate calls if theme hasn't changed
    if (newTheme === theme || settingsLoading) {
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
        credentials: "include",
      });

      if (res.ok) {
        const result = await res.json();
        // Update local theme
        setTheme(newTheme);
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            theme: result.theme,
          },
        });
        toast.success("Theme updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update theme");
      }
    } catch {
      toast.error("Failed to update theme");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Password updated successfully");
        passwordForm.reset();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update password");
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarImage(data.image);
        setAvatarImageError(false); // Reset error state on successful upload

        // Update session with new image
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.image,
          },
        });

        // Reload profile data to get updated avatar
        await loadProfileData();

        toast.success("Avatar updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profileData) {
    return <div>Failed to load profile data</div>;
  }

  const { user, department, stats, recentActivity } = profileData;

  // Generate initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Avatar className="h-20 w-20">
              {!avatarImageError && avatarImage ? (
                <AvatarImage
                  src={avatarImage}
                  alt={user.name || user.email || "User"}
                  onError={() => setAvatarImageError(true)}
                />
              ) : null}
              <AvatarFallback className="text-lg bg-primary text-primary-foreground font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Edit icon overlay */}
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleEditAvatarClick}
                disabled={isUploadingAvatar}
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                } ${isUploadingAvatar ? "cursor-wait" : "cursor-pointer"}`}
                aria-label="Edit avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Pencil className="h-6 w-6 text-white" />
                )}
              </button>
            </>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || "User"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-2">
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Settings Toggle Button */}
        <Button
          variant="outline"
          onClick={() => setSettingsVisible(!settingsVisible)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {settingsVisible ? "Hide Settings" : "Settings"}
        </Button>
      </div>

      {/* Settings Section */}
      {settingsVisible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      {...profileForm.register("name", {
                        required: "Name is required",
                      })}
                      placeholder="Enter your name"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Current Information</Label>
                    <div className="bg-muted rounded p-3">
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p>
                        <strong>Role:</strong> {user.role}
                      </p>
                    </div>
                  </div>
                  <Button type="submit" disabled={settingsLoading}>
                    {settingsLoading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="theme" className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Tabs
                    value={theme ?? "light"}
                    onValueChange={(newTheme) => handleThemeChange(newTheme)}
                  >
                    <TabsList>
                      <TabsTrigger value="light">Light</TabsTrigger>
                      <TabsTrigger value="dark">Dark</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailChange)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">New Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...emailForm.register("email", {
                        required: "Email is required",
                      })}
                    />
                  </div>
                  <Button type="submit" disabled={settingsLoading}>
                    {settingsLoading ? "Updating..." : "Update Email"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="password" className="space-y-4">
                <form
                  onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword", {
                        required: "Current password is required",
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword", {
                        required: "New password is required",
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword", {
                        required: "Please confirm your password",
                      })}
                    />
                  </div>
                  <Button type="submit" disabled={settingsLoading}>
                    {settingsLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Profile Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Completion</span>
                <span className="font-semibold">
                  {stats.overallCompletion}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${stats.overallCompletion}%` }}
                />
              </div>
              <div className="text-muted-foreground text-sm">
                {stats.completedCourses} of {stats.totalCourses} courses
                completed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-lg font-semibold"
              data-department-id={user.departmentId}
            >
              {department?.name || "No department"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span>{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since:</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-muted flex items-center justify-between rounded p-2"
                >
                  <span className="text-sm">{activity.courseTitle}</span>
                  <Badge variant="outline">
                    {activity.completedLessons} lessons completed
                  </Badge>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No courses enrolled yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
