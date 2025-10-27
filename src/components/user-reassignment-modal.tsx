"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

type Department = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
};

interface UserReassignmentModalProps {
  user: User;
  onUserReassigned: () => void;
}

export function UserReassignmentModal({
  user,
  onUserReassigned,
}: UserReassignmentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    user.departmentId
  );

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    const res = await fetch("/api/departments");
    if (res.ok) {
      const deptData = await res.json();
      setDepartments(deptData.departments);
    }
  }

  const handleReassign = async () => {
    if (selectedDepartmentId === user.departmentId) {
      toast.error("User is already in this department");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: selectedDepartmentId }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        setOpen(false);
        onUserReassigned();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to reassign user");
      }
    } catch {
      toast.error("Failed to reassign user");
    } finally {
      setLoading(false);
    }
  };

  const currentDepartment = departments.find(d => d.id === user.departmentId);
  const selectedDepartment = departments.find(
    d => d.id === selectedDepartmentId
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign User to Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded p-3">
            <div className="font-medium">{user.name || "No name"}</div>
            <div className="text-muted-foreground text-sm">{user.email}</div>
            <div className="text-muted-foreground text-sm">
              Current Department: {currentDepartment?.name || "Unknown"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Department</label>
            <Select
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDepartmentId !== user.departmentId && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">
                    Important Notice
                  </div>
                  <div className="mt-1 text-yellow-700">
                    Reassigning this user will:
                    <ul className="mt-1 list-inside list-disc space-y-1">
                      <li>
                        Remove their enrollments from courses not in the new
                        department
                      </li>
                      <li>
                        Delete their progress for lessons in courses not in the
                        new department
                      </li>
                      <li>
                        Move them to:{" "}
                        <strong>{selectedDepartment?.name}</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={loading || selectedDepartmentId === user.departmentId}
            >
              {loading ? "Reassigning..." : "Reassign User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
