"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EnrollmentManager } from "@/components/enrollment-manager";
import { AdminUserEditModal } from "@/components/admin-user-edit-modal";
import { UserReassignmentModal } from "@/components/user-reassignment-modal";
import { TrendingUp, Users, BookOpen, Building2, Link } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  createdAt: string;
};

type DepartmentStats = {
  department: {
    id: string;
    name: string;
    orgNr: string | null;
  };
  stats: {
    completionRate: number;
    totalLessons: number;
    completedLessons: number;
    userStats: {
      total: number;
      admins: number;
      basic: number;
    };
    totalEnrolledCourses: number;
  };
  users: User[];
  courses: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departmentStats, setDepartmentStats] =
    useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "BASIC",
  });

  useEffect(() => {
    loadUsers();
    loadDepartmentStats();
    loadCurrentUserRole();
  }, []);

  async function loadCurrentUserRole() {
    const res = await fetch("/api/session", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setCurrentUserRole(data.user?.role || "");
    }
  }

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }

  async function loadDepartmentStats() {
    const res = await fetch("/api/admin/department-stats", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setDepartmentStats(data);
    }
  }

  async function createUser() {
    if (!formData.name || !formData.email) return;

    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);

    if (res.ok) {
      setFormData({ name: "", email: "", role: "BASIC" });
      setShowCreateForm(false);
      await loadUsers();
      await loadDepartmentStats();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Department Management</h1>
        <Button onClick={() => setShowCreateForm(true)}>Add User</Button>
      </div>

      {/* Department Overview */}
      {departmentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {departmentStats.department.name}
              {departmentStats.department.orgNr && (
                <Badge variant="outline" className="ml-2">
                  Org: {departmentStats.department.orgNr}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <TrendingUp className="h-6 w-6" />
                  {departmentStats.stats.completionRate}%
                </div>
                <div className="text-muted-foreground text-sm">
                  Completion Rate
                </div>
                <div className="text-muted-foreground text-xs">
                  {departmentStats.stats.completedLessons}/
                  {departmentStats.stats.totalLessons} lessons
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Users className="h-6 w-6" />
                  {departmentStats.stats.userStats.total}
                </div>
                <div className="text-muted-foreground text-sm">Total Users</div>
                <div className="text-muted-foreground text-xs">
                  {departmentStats.stats.userStats.admins} admin,{" "}
                  {departmentStats.stats.userStats.basic} basic
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <BookOpen className="h-6 w-6" />
                  {departmentStats.stats.totalEnrolledCourses}
                </div>
                <div className="text-muted-foreground text-sm">
                  Total Enrolled Courses
                </div>
                <div className="text-muted-foreground text-xs">
                  Across {departmentStats.stats.userStats.total} user
                  {departmentStats.stats.userStats.total !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-background w-full rounded-md border px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-background w-full rounded-md border px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="bg-background w-full rounded-md border px-3 py-2"
                >
                  {currentUserRole === "AUTHOR" ? (
                    <>
                      <option value="BASIC">Basic User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="AUTHOR">Author</option>
                    </>
                  ) : (
                    <>
                      <option value="BASIC">Basic User</option>
                      <option value="ADMIN">Admin</option>
                    </>
                  )}
                </select>
                {currentUserRole === "ADMIN" && (
                  <p className="text-muted-foreground text-xs">
                    ADMIN users can only create BASIC or ADMIN users
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sign-up Link</Label>
              <div className="flex items-center gap-2">
                <input
                  value={`${window.location.origin}/sign-up?email=${encodeURIComponent(formData.email)}&role=${formData.role}`}
                  readOnly
                  className="bg-background w-full rounded-md border px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const signupUrl = `${window.location.origin}/sign-up?email=${encodeURIComponent(formData.email)}&role=${formData.role}`;
                    navigator.clipboard.writeText(signupUrl);
                    toast.success("Sign-up link copied to clipboard");
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Copy this link and send it to the user to complete their
                registration
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={createUser} disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {user.email}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Role: {user.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground text-sm">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {currentUserRole !== "BASIC" && (
                      <AdminUserEditModal
                        user={user}
                        onUserUpdate={loadUsers}
                        currentUserRole={currentUserRole}
                      />
                    )}
                    {currentUserRole === "AUTHOR" && (
                      <UserReassignmentModal
                        user={user}
                        onUserReassigned={loadUsers}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
