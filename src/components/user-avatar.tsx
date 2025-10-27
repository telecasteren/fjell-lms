"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Building2 } from "lucide-react";

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showPopover?: boolean;
}

export function UserAvatar({ user, size = "md", showPopover = true }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Generate initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get role color
  const getRoleColor = (role?: string) => {
    switch (role) {
      case "AUTHOR":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "BASIC":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const avatarElement = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User"} />
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );

  if (!showPopover) {
    return avatarElement;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
          {avatarElement}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* User Info Header */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {user.name || "No name"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Role Badge */}
          {user.role && (
            <div className="flex items-center space-x-2">
              <Shield className={`${iconSizeClasses.md} text-muted-foreground`} />
              <Badge 
                variant="outline" 
                className={`${getRoleColor(user.role)} ${textSizeClasses.sm}`}
              >
                {user.role}
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <User className={`${iconSizeClasses.sm} mr-2`} />
              View Profile
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Mail className={`${iconSizeClasses.sm} mr-2`} />
              Contact Support
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              FOX-LMS v1.0.0
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
