"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Course = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  departmentName?: string;
  enrollmentCount: number;
};
type Enrollment = {
  id: string;
  course: { id: string; title: string; description: string };
};

export default function GetStartedPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has permission to view this page
  const canView =
    session?.user?.role === "AUTHOR" ||
    session?.user?.role === "WRITER" ||
    session?.user?.role === "ADMIN";

  useEffect(() => {
    // Redirect if user doesn't have permission
    if (session && !canView) {
      router.push("/courses");
      return;
    }
    if (session) {
      load();
    }
  }, [session, router, canView]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/courses", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      // Filter only FOX-LMS courses
      const foxLmsCourses = data.courses.filter(
        (c: Course & { isFoxLmsCourse?: boolean }) =>
          c.isFoxLmsCourse && c.status === "PUBLISHED",
      );
      setCourses(foxLmsCourses);
    }

    const enrollRes = await fetch("/api/enrollments", {
      credentials: "include",
    });
    if (enrollRes.ok) {
      const enrollData = await enrollRes.json();
      setEnrollments(enrollData.enrollments);
    }
    setLoading(false);
  }

  async function enrollInCourse(courseId: string) {
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
      credentials: "include",
    });
    if (res.ok) await load();
  }

  async function unenrollFromCourse(courseId: string) {
    const res = await fetch("/api/enrollments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
      credentials: "include",
    });
    if (res.ok) await load();
  }

  function isEnrolled(courseId: string) {
    return enrollments.some((e) => e.course.id === courseId);
  }

  // Don't render if user doesn't have permission
  if (session && !canView) {
    return <div>Redirecting...</div>;
  }

  if (loading || !session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/courses")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Get Started</h1>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/courses")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Get Started</h1>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Foundational Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Explore our foundational courses to get started with your learning
            journey. These courses are designed to help you build a strong
            foundation.
          </p>
        </CardContent>
      </Card>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No foundational courses available at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{c.title}</CardTitle>
                  <Badge variant="default">PUBLISHED</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{c.description}</p>

                <div className="flex gap-2">
                  {isEnrolled(c.id) ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => unenrollFromCourse(c.id)}
                      >
                        Leave Course
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          (window.location.href = `/courses/${c.id}/learn`)
                        }
                      >
                        Learn
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => enrollInCourse(c.id)}
                    >
                      Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
