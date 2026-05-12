"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  BarChart3,
  UserCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentSearchInput } from "@/components/department-search-input";

type DepartmentReport = {
  departmentId: string;
  departmentName: string;
  userStats: {
    total: number;
    byRole: {
      BASIC: number;
      ADMIN: number;
      AUTHOR: number;
      WRITER: number;
    };
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  };
  courseStats: {
    total: number;
    byStatus: {
      DRAFT: number;
      PUBLISHED: number;
      ARCHIVED: number;
    };
    totalEnrollments: number;
  };
  progressStats: {
    overallCompletionRate: number;
    totalLessons: number;
    completedLessons: number;
    userProgress: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
      completed: number;
      total: number;
      completionRate: number;
      totalCourses?: number;
      completedCourses?: number;
    }>;
  };
  coursePerformance: Array<{
    courseId: string;
    courseTitle: string;
    enrollments: number;
    completedEnrollments: number;
    completionRate: number;
    status: string;
  }>;
  createdAt: string;
};

type ReportsData = {
  overallStats: {
    totalDepartments: number;
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
  };
  departmentReports: DepartmentReport[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportDepartmentId, setExportDepartmentId] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function loadData() {
      try {
        const res = await fetch("/api/reports/departments", {
          credentials: "include",
        });
        if (res.ok && mounted) {
          const reportsData = await res.json();
          setData(reportsData);
        } else if (res.status === 429 && mounted) {
          // Rate limit exceeded - wait and retry once
          console.warn("Rate limit exceeded. Retrying in 60 seconds...");
          timeoutId = setTimeout(() => {
            if (mounted) loadData();
          }, 60000); // Wait 1 minute before retry
          return;
        }
        if (mounted) setLoading(false);

        // Get user role for UI customization
        const sessionRes = await fetch("/api/session", {
          credentials: "include",
        });
        if (sessionRes.ok && mounted) {
          const sessionData = await sessionRes.json();
          setUserRole(sessionData.user?.role);
        }
      } catch (error) {
        console.error("Error loading reports:", error);
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadReports();
    };

    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
  }, []);

  async function loadReports() {
    try {
      const res = await fetch("/api/reports/departments", {
        credentials: "include",
      });
      if (res.ok) {
        const reportsData = await res.json();
        setData(reportsData);
      } else if (res.status === 429) {
        // Rate limit exceeded
        console.warn("Rate limit exceeded. Please wait before refreshing.");
        return;
      }
      setLoading(false);

      // Get user role for UI customization
      const sessionRes = await fetch("/api/session", {
        credentials: "include",
      });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setUserRole(sessionData.user?.role);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (!data) return;

    // Determine which departments to export based on selection
    let reportsToExport: DepartmentReport[];
    let filename: string;
    let selectedDeptName: string | null = null;

    if (userRole === "AUTHOR") {
      // AUTHOR users can select specific department or all
      if (exportDepartmentId === "all") {
        // Export all departments (respect search filter if active)
        reportsToExport = searchQuery.trim()
          ? data.departmentReports.filter((dept) =>
              dept.departmentName
                .toLowerCase()
                .includes(searchQuery.toLowerCase().trim()),
            )
          : data.departmentReports;
        filename = "all-departments-report.csv";
      } else {
        // Export specific department
        const selectedDept = data.departmentReports.find(
          (dept) => dept.departmentId === exportDepartmentId,
        );
        if (!selectedDept) {
          console.error("Selected department not found");
          return;
        }
        reportsToExport = [selectedDept];
        selectedDeptName = selectedDept.departmentName;
        // Sanitize filename (remove special characters)
        const sanitizedName = selectedDeptName
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();
        filename = `${sanitizedName}-report.csv`;
      }

      // AUTHOR gets department-level overview
      const csvContent = [
        [
          "Department",
          "Users",
          "Courses",
          "Enrollments",
          "Completion Rate",
          "Top Course",
        ],
        ...reportsToExport.map((dept) => [
          dept.departmentName,
          dept.userStats.total.toString(),
          dept.courseStats.total.toString(),
          dept.courseStats.totalEnrollments.toString(),
          `${dept.progressStats.overallCompletionRate}%`,
          dept.coursePerformance[0]?.courseTitle || "N/A",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (userRole === "ADMIN") {
      // ADMIN users can select specific department or export all their accessible departments
      if (exportDepartmentId === "all") {
        // Export all accessible departments
        reportsToExport = data.departmentReports;
        filename = "all-departments-report.csv";
      } else {
        // Export specific department
        const selectedDept = data.departmentReports.find(
          (dept) => dept.departmentId === exportDepartmentId,
        );
        if (!selectedDept) {
          console.error("Selected department not found");
          return;
        }
        reportsToExport = [selectedDept];
        selectedDeptName = selectedDept.departmentName;
        // Sanitize filename (remove special characters)
        const sanitizedName = selectedDeptName
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();
        filename = `${sanitizedName}-report.csv`;
      }

      // ADMIN gets department-level overview (same format as AUTHOR)
      const csvContent = [
        [
          "Department",
          "Users",
          "Courses",
          "Enrollments",
          "Completion Rate",
          "Top Course",
        ],
        ...reportsToExport.map((dept) => [
          dept.departmentName,
          dept.userStats.total.toString(),
          dept.courseStats.total.toString(),
          dept.courseStats.totalEnrollments.toString(),
          `${dept.progressStats.overallCompletionRate}%`,
          dept.coursePerformance[0]?.courseTitle || "N/A",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // WRITER/BASIC gets user-level activity report for their department
      const csvContent = [
        [
          "Name",
          "Email",
          "Role",
          "Total Courses",
          "Completed Courses",
          "Completion Rate",
          "Total Lessons",
          "Completed Lessons",
        ],
        ...data.departmentReports.flatMap((dept) =>
          dept.progressStats.userProgress.map((user) => [
            user.userName,
            user.userEmail,
            user.userRole,
            user.totalCourses?.toString() || "0",
            user.completedCourses?.toString() || "0",
            user.completionRate.toString() + "%",
            user.total.toString(),
            user.completed.toString(),
          ]),
        ),
      ]
        .map((row) => row.join(","))
        .join("\n");
      filename = "user-activity-report.csv";

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Card key={j}>
                      <CardContent className="p-4">
                        <Skeleton className="h-8 w-12 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Error loading reports</div>;
  }

  // Filter departments based on search query (for AUTHOR and ADMIN users)
  const filteredDepartmentReports =
    (userRole === "AUTHOR" || userRole === "ADMIN") && searchQuery.trim()
      ? data.departmentReports.filter((dept) =>
          dept.departmentName
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim()),
        )
      : data.departmentReports;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Department Reports</h1>
          <p className="text-muted-foreground text-sm">
            {userRole === "AUTHOR"
              ? "Comprehensive analytics across all departments"
              : userRole === "ADMIN"
                ? "Analytics for your department and sub-departments"
                : "Analytics for your department"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {(userRole === "AUTHOR" || userRole === "ADMIN") && (
            <Select
              value={exportDepartmentId}
              onValueChange={setExportDepartmentId}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select department to export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {data.departmentReports.map((dept) => (
                  <SelectItem key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
            {(userRole === "AUTHOR" || userRole === "ADMIN") &&
              exportDepartmentId !== "all" && (
                <span className="ml-2 text-xs opacity-70">
                  (
                  {data?.departmentReports.find(
                    (d) => d.departmentId === exportDepartmentId,
                  )?.departmentName || ""}
                  )
                </span>
              )}
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === "AUTHOR"
              ? "Platform Overview"
              : userRole === "ADMIN"
                ? "Department Overview"
                : "Department Overview"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {userRole === "AUTHOR" && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Building2 className="h-6 w-6" />
                  {data.overallStats.totalDepartments}
                </div>
                <div className="text-muted-foreground text-sm">Departments</div>
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6" />
                {data.overallStats.totalUsers}
              </div>
              <div className="text-muted-foreground text-sm">Users</div>
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
                {data.overallStats.totalEnrollments}
              </div>
              <div className="text-muted-foreground text-sm">Enrollments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          </TabsList>
          {(userRole === "AUTHOR" || userRole === "ADMIN") && (
            <DepartmentSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search departments..."
            />
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {filteredDepartmentReports.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery.trim()
                      ? `No departments found matching "${searchQuery}"`
                      : "No department data available"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDepartmentReports.map((dept) => (
                <Card key={dept.departmentId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {dept.departmentName}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Created{" "}
                          {new Date(dept.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="px-3 py-1 text-lg">
                        {dept.progressStats.overallCompletionRate}% Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {dept.userStats.total}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Users
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {dept.courseStats.total}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Courses
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {dept.courseStats.totalEnrollments}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Enrollments
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {dept.progressStats.completedLessons}/
                          {dept.progressStats.totalLessons}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Lessons
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {filteredDepartmentReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery.trim()
                    ? `No departments found matching "${searchQuery}"`
                    : "No detailed reports available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDepartmentReports.map((dept) => (
              <Card key={dept.departmentId}>
                <CardHeader>
                  <CardTitle>{dept.departmentName} - Detailed Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Statistics */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <Users className="h-5 w-5" />
                      User Statistics
                    </h3>
                    <div className="mb-4 grid grid-cols-4 gap-4">
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.userStats.byRole.BASIC}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Basic Users
                        </div>
                      </div>
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.userStats.byRole.ADMIN}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Admins
                        </div>
                      </div>
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.userStats.byRole.AUTHOR}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Authors
                        </div>
                      </div>
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.userStats.byRole.WRITER}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Writers
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-medium">Recent Users</h4>
                      <div className="space-y-1">
                        {dept.userStats.recentUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex justify-between text-sm"
                          >
                            <span>{user.name || user.email}</span>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Course Statistics */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <BookOpen className="h-5 w-5" />
                      Course Statistics
                    </h3>
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.courseStats.byStatus.DRAFT}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Draft
                        </div>
                      </div>
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.courseStats.byStatus.PUBLISHED}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Published
                        </div>
                      </div>
                      <div className="bg-muted rounded p-3 text-center">
                        <div className="text-lg font-bold">
                          {dept.courseStats.byStatus.ARCHIVED}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Archived
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Performing Courses */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <BarChart3 className="h-5 w-5" />
                      Top Performing Courses
                    </h3>
                    <div className="space-y-2">
                      {dept.coursePerformance.slice(0, 5).map((course) => (
                        <div
                          key={course.courseId}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <div>
                            <div className="font-medium">
                              {course.courseTitle}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {course.enrollments} enrollments •{" "}
                              {course.completedEnrollments} completed
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {course.completionRate}%
                            </Badge>
                            <div className="text-muted-foreground mt-1 text-xs">
                              {course.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Progress */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <UserCheck className="h-5 w-5" />
                      User Progress
                    </h3>
                    <div className="space-y-2">
                      {dept.progressStats.userProgress
                        .slice(0, 10)
                        .map((user) => (
                          <div
                            key={user.userId}
                            className="flex items-center justify-between rounded border p-2"
                          >
                            <div>
                              <div className="font-medium">{user.userName}</div>
                              <div className="text-muted-foreground text-sm">
                                {user.userEmail}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {user.completionRate}%
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {user.completed}/{user.total} lessons
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
