"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, BookOpen, TrendingUp, Trash2 } from "lucide-react";
import { UserEditModal } from "@/components/user-edit-modal";
import { UserReassignmentModal } from "@/components/user-reassignment-modal";
import { DepartmentCreationModal } from "@/components/department-creation-modal";
import { DepartmentBrandingSettings } from "@/components/department-branding-settings";
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import toast from "react-hot-toast";

type Department = {
  id: string;
  name: string;
  _count: {
    users: number;
    courses: number;
  };
};

type DepartmentDetails = {
  id: string;
  name: string;
  logoUrl?: string | null;
  darkModeLogoUrl?: string | null;
  logoText?: string | null;
  completionRate: number;
  totalLessons: number;
  completedLessons: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string;
    createdAt: string;
  }>;
  courses: Array<{
    id: string;
    title: string;
    status: string;
    _count: {
      enrollments: number;
    };
  }>;
};

type EnrolledCourse = {
  id: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
};

type AuthorDashboardData = {
  overallStats: {
    totalUsers: number;
    totalDepartments: number;
    totalCourses: number;
    averageCompletedCourses: number;
  };
  departments: Department[];
};

export default function AuthorDashboard() {
  const [data, setData] = useState<AuthorDashboardData | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentDetails, setDepartmentDetails] =
    useState<DepartmentDetails | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigure, setShowConfigure] = useState(false);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const { refreshDashboard } = useDashboardRefresh();
  const { user: currentUser } = useCurrentUser();

  useEffect(() => {
    loadDashboard();
    loadEnrolledCourses();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentDetails(selectedDepartment);
    }
  }, [selectedDepartment]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadDashboard();
      loadEnrolledCourses();
      if (selectedDepartment) {
        loadDepartmentDetails(selectedDepartment);
      }
    };

    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
  }, [selectedDepartment]);

  async function loadDashboard() {
    const res = await fetch("/api/author/dashboard");
    if (res.ok) {
      const dashboardData = await res.json();
      setData(dashboardData);
    }
    setLoading(false);
  }

  async function loadEnrolledCourses() {
    const res = await fetch("/api/enrollments");
    if (res.ok) {
      const enrollmentData = await res.json();
      setEnrolledCourses(enrollmentData.enrollments);
    }
  }

  async function unenrollFromCourse(courseId: string) {
    const res = await fetch("/api/enrollments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      await loadEnrolledCourses();
    }
  }

  async function loadDepartmentDetails(departmentId: string) {
    const res = await fetch(`/api/author/departments/${departmentId}`);
    if (res.ok) {
      const deptData = await res.json();
      setDepartmentDetails(deptData.department);
    }
  }

  function handleUserUpdate() {
    if (selectedDepartment) {
      loadDepartmentDetails(selectedDepartment);
    }
  }

  function handleDepartmentCreated() {
    loadDashboard();
  }

  async function handleDeleteDepartment() {
    if (!departmentToDelete) return;

    try {
      const res = await fetch(`/api/departments?id=${departmentToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        setShowDeleteDialog(false);
        setDepartmentToDelete(null);
        
        // Reset selected department if it was deleted
        if (selectedDepartment === departmentToDelete) {
          setSelectedDepartment("");
          setDepartmentDetails(null);
        }
        
        // Reload dashboard to refresh department list
        loadDashboard();
        refreshDashboard();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete department");
      }
    } catch (error) {
      console.error("Delete department error:", error);
      toast.error("Failed to delete department");
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage departments and users across the platform
        </p>
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6" />
                {data.overallStats.totalUsers}
              </div>
              <div className="text-muted-foreground text-sm">Total Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <Building2 className="h-6 w-6" />
                {data.overallStats.totalDepartments}
              </div>
              <div className="text-muted-foreground text-sm">Departments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <BookOpen className="h-6 w-6" />
                {data.overallStats.totalCourses}
              </div>
              <div className="text-muted-foreground text-sm">Courses</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <TrendingUp className="h-6 w-6" />
                {data.overallStats.averageCompletedCourses}
              </div>
              <div className="text-muted-foreground text-sm">
                Avg Completed Courses
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Department Management</CardTitle>
            <Button onClick={() => setShowCreateDepartment(true)}>
              Add new
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Select Department:</span>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent>
                  {data.departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept._count.users} users,{" "}
                      {dept._count.courses} courses)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {departmentDetails && (
              <div className="space-y-4">
                {/* Department Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {departmentDetails.completionRate}%
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {departmentDetails.completedLessons}/
                        {departmentDetails.totalLessons} lessons
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {departmentDetails.users.length}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Total users
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {departmentDetails.courses.length}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Total courses
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDepartmentToDelete(departmentDetails.id);
                      setShowDeleteDialog(true);
                    }}
                    disabled={
                      !departmentDetails || 
                      departmentDetails.users.length > 0 ||
                      currentUser?.departmentId === departmentDetails.id
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Department
                  </Button>
                  <Button
                    onClick={() => setShowConfigure(!showConfigure)}
                    variant={showConfigure ? "secondary" : "default"}
                  >
                    {showConfigure ? "Hide Configure" : "Configure"}
                  </Button>
                </div>

                {/* Configuration Panel */}
                {showConfigure && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Department Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* User List */}
                        <div>
                          <h3 className="mb-3 text-lg font-semibold">
                            User List
                          </h3>
                          <div className="space-y-2">
                            {departmentDetails.users.map(user => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between rounded border p-3"
                              >
                                <div>
                                  <div className="font-medium">
                                    {user.name || "No name"}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {user.email}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{user.role}</Badge>
                                  <UserEditModal
                                    user={user}
                                    onUserUpdate={handleUserUpdate}
                                  />
                                  <UserReassignmentModal
                                    user={user}
                                    onUserReassigned={handleUserUpdate}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Department Admin */}
                        <div>
                          <h3 className="mb-3 text-lg font-semibold">
                            Department Admin
                          </h3>
                          <div className="space-y-2">
                            {departmentDetails.users
                              .filter(user => user.role === "ADMIN")
                              .map(admin => (
                                <div
                                  key={admin.id}
                                  className="bg-muted rounded p-2"
                                >
                                  <div className="font-medium">
                                    {admin.name || "No name"}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {admin.email}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Department Branding Settings */}
                        {departmentDetails && (
                          <DepartmentBrandingSettings
                            departmentId={departmentDetails.id}
                            departmentName={departmentDetails.name}
                            currentLogoUrl={departmentDetails.logoUrl}
                            currentLogoText={departmentDetails.logoText}
                            currentDarkModeLogoUrl={departmentDetails.darkModeLogoUrl}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>You are not enrolled in any courses yet.</p>
              <p className="text-sm">
                Visit the Courses page to enroll in available courses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map(enrollment => (
                <div
                  key={enrollment.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {enrollment.course.title}
                    </h3>
                    {enrollment.course.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {enrollment.course.description}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-2 text-xs">
                      Enrolled on{" "}
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href = `/courses/${enrollment.course.id}`)
                      }
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => unenrollFromCourse(enrollment.course.id)}
                    >
                      Leave Course
                    </Button>
                    <Button
                      variant="default"
                      onClick={() =>
                        (window.location.href = `/courses/${enrollment.course.id}/learn`)
                      }
                    >
                      Learn
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Creation Modal */}
      <DepartmentCreationModal
        isOpen={showCreateDepartment}
        onClose={() => setShowCreateDepartment(false)}
        onDepartmentCreated={handleDepartmentCreated}
      />

      {/* Delete Department Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteDepartment}
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentDetails?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
