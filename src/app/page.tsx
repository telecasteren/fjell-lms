"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

type Course = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
};

type DashboardData = {
  currentCourse: Course | null;
  ongoingCourses: Course[];
  completedCourses: Course[];
  notStartedCourses: Course[];
  overallStats: {
    totalCourses: number;
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If authentication is still loading, wait
    if (status === "loading") return;

    // If no session, redirect to login
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    // Redirect AUTHOR users to author dashboard
    if (session?.user && session.user.role === Role.AUTHOR) {
      router.push("/author");
      return;
    }

    loadDashboard();
  }, [session, status, router]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadDashboard();
    };

    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
  }, []);

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const dashboardData = await res.json();
      setData(dashboardData);
    }
    setLoading(false);
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Don't render anything if redirecting to login
  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Overall Statistics Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-3 w-full mt-4 rounded-full" />
          </CardContent>
        </Card>

        {/* Current Course Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Ongoing and Completed Courses Skeleton */}
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="space-y-3 rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
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
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your courses and progress.
        </p>
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            {/* Cake Diagram */}
            <div className="relative h-24 w-24">
              <svg
                className="h-24 w-24 -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${data.overallStats.percentage * 2.51} 251`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-sm font-semibold">
                  {data.overallStats.percentage}%
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.overallStats.completedLessons}
                </div>
                <div className="text-muted-foreground text-sm">
                  Lessons Done
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.overallStats.totalLessons}
                </div>
                <div className="text-muted-foreground text-sm">
                  Total Lessons
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.overallStats.totalCourses}
                </div>
                <div className="text-muted-foreground text-sm">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.ongoingCourses.length}
                </div>
                <div className="text-muted-foreground text-sm">Ongoing</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${data.overallStats.percentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Current Course in Focus */}
      {data.currentCourse && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">
              Current Course in Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-blue-200 bg-white p-4 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    {data.currentCourse.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {data.currentCourse.completedCount}/
                    {data.currentCourse.totalCount} lessons (
                    {data.currentCourse.percentage}%)
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={() =>
                    (window.location.href = `/courses/${data.currentCourse!.id}/learn`)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue Learning
                </Button>
              </div>
              {/* Progress Bar */}
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${data.currentCourse.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Ongoing Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ongoingCourses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No ongoing courses.
              </p>
            ) : (
              <div className="space-y-3">
                {data.ongoingCourses.map((course) => (
                  <div key={course.id} className="space-y-3 rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {course.completedCount}/{course.totalCount} lessons (
                          {course.percentage}%)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/courses/${course.id}/learn`)
                        }
                      >
                        Continue
                      </Button>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${course.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {data.completedCourses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No completed courses yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.completedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded border bg-green-50 p-3 dark:bg-green-950"
                  >
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {course.completedCount}/{course.totalCount} lessons
                        (100%)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/courses/${course.id}/learn`)
                      }
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Not Started Courses */}
      {data.notStartedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.notStartedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    {course.description && (
                      <p className="text-muted-foreground text-sm">
                        {course.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/courses/${course.id}/learn`)
                    }
                  >
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
