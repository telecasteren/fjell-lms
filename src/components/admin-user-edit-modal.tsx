"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Edit, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  createdAt: string;
}

interface AdminUserEditModalProps {
  user: User;
  onUserUpdate: () => void;
  currentUserRole: string;
}

export function AdminUserEditModal({
  user,
  onUserUpdate,
  currentUserRole,
}: AdminUserEditModalProps) {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email,
    role: user.role,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Check if the user is trying to delete themselves
  const isCurrentUser = session?.user?.id === user.id;

  // Check if current user can edit this user
  const canEditUser = () => {
    // Don't allow editing if role hasn't loaded yet
    if (!currentUserRole) return false;

    // AUTHOR users can edit anyone
    if (currentUserRole === "AUTHOR") return true;

    // ADMIN/BASIC users cannot edit AUTHOR users
    if (user.role === "AUTHOR") return false;

    // ADMIN users can edit BASIC/ADMIN users
    if (currentUserRole === "ADMIN") return true;

    // BASIC users cannot edit anyone
    return false;
  };

  const canEditThisUser = canEditUser();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("User updated successfully");
        setOpen(false);
        // Call the callback to refresh the parent component's data
        onUserUpdate();

        // If updating the current user, refresh the session
        if (isCurrentUser) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: result.user.name,
              email: result.user.email,
              role: result.user.role,
            },
          });

          // Trigger a page refresh to update the sidebar
          window.location.reload();
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch {
      console.error("Update user error:", error);
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isCurrentUser) {
      toast.error("You cannot delete your own account");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("User deleted successfully");
        setDeleteConfirmation(false);
        onUserUpdate();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch {
      console.error("Delete user error:", error);
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    return [
      { value: "BASIC", label: "Basic User" },
      { value: "ADMIN", label: "Admin" },
      { value: "AUTHOR", label: "Author" },
    ];
  };

  // Check if a role should be disabled for the current user
  const isRoleDisabled = (roleValue: string) => {
    // Disable all roles if role hasn't loaded yet
    if (!currentUserRole) return true;

    // AUTHOR users can select any role
    if (currentUserRole === "AUTHOR") return false;

    // ADMIN/BASIC users cannot select AUTHOR role
    if (roleValue === "AUTHOR") return true;

    // ADMIN users can select BASIC or ADMIN
    if (currentUserRole === "ADMIN") return false;

    // BASIC users cannot select any roles (they shouldn't be editing anyway)
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!canEditThisUser}>
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={value =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(roleOption => (
                    <SelectItem
                      key={roleOption.value}
                      value={roleOption.value}
                      disabled={isRoleDisabled(roleOption.value)}
                    >
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUserRole === "ADMIN" && (
                <p className="text-muted-foreground text-xs">
                  ADMIN users can only set BASIC or ADMIN roles
                </p>
              )}
              {currentUserRole === "BASIC" && (
                <p className="text-muted-foreground text-xs">
                  BASIC users cannot edit other users
                </p>
              )}
              {user.role === "AUTHOR" && currentUserRole !== "AUTHOR" && (
                <p className="text-muted-foreground text-xs">
                  Only AUTHOR users can edit AUTHOR users
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update User"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirmation}
        onClose={() => {
          setDeleteConfirmation(false);
          // Keep edit dialog closed
        }}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(false); // Close edit dialog
          setDeleteConfirmation(true); // Open delete confirmation
        }}
        disabled={isCurrentUser || !canEditThisUser}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}
