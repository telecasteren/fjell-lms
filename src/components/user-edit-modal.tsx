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
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useSession } from "next-auth/react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

interface UserEditModalProps {
  user: User;
  onUserUpdate: () => void;
}

export function UserEditModal({ user, onUserUpdate }: UserEditModalProps) {
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

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/author/users/${user.id}`, {
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
    setOpen(false); // Close the edit dialog
    setDeleteConfirmation(true); // Open delete confirmation
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/author/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("User deleted successfully");
        setOpen(false);
        onUserUpdate();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
      setDeleteConfirmation(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(false);
    // Keep the edit dialog closed
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
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
                setFormData(prev => ({ ...prev, name: e.target.value }))
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
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="AUTHOR">Author</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || isCurrentUser}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <ConfirmationDialog
        isOpen={deleteConfirmation}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
      />
    </Dialog>
  );
}
