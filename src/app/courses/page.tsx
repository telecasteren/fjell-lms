"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

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
type User = { role: string; departmentId: string };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    courseId: string | null;
    courseTitle: string;
  }>({
    isOpen: false,
    courseId: null,
    courseTitle: "",
  });

  async function load() {
    const res = await fetch("/api/courses", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setCourses(data.courses);
      setUser(data.user);
    }

    const enrollRes = await fetch("/api/enrollments", {
      credentials: "include",
    });
    if (enrollRes.ok) {
      const enrollData = await enrollRes.json();
      setEnrollments(enrollData.enrollments);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCourse() {
    if (!title.trim()) return;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setTitle("");
      setDescription("");
      await load();
      // Redirect to course management page
      window.location.href = `/courses/${data.course.id}`;
    }
  }

  async function deleteCourse(id: string) {
    const res = await fetch(`/api/courses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) await load();
  }

  function handleDeleteClick(courseId: string, courseTitle: string) {
    setDeleteConfirmation({
      isOpen: true,
      courseId,
      courseTitle,
    });
  }

  function handleDeleteConfirm() {
    if (deleteConfirmation.courseId) {
      deleteCourse(deleteConfirmation.courseId);
    }
  }

  function handleDeleteCancel() {
    setDeleteConfirmation({
      isOpen: false,
      courseId: null,
      courseTitle: "",
    });
  }

  async function updateCourseStatus(courseId: string, status: string) {
    const res = await fetch(`/api/courses/${courseId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include",
    });
    if (res.ok) await load();
  }

  function getStatusBadgeVariant(status?: string) {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "ARCHIVED":
        return "secondary";
      case "DRAFT":
        return "outline";
      default:
        return "outline";
    }
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
    return enrollments.some(e => e.course.id === courseId);
  }

  function isAuthor() {
    return user?.role === "AUTHOR";
  }

  function canDeleteCourse(course: Course) {
    return isAuthor() && course.enrollmentCount === 0;
  }

  function getFilteredCourses() {
    if (!user) return courses;

    // AUTHOR sees all courses (including archived)
    if (user.role === "AUTHOR") {
      return courses;
    }

    // BASIC and ADMIN only see published courses
    return courses.filter(course => course.status === "PUBLISHED");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Courses</h1>

      {/* Create course section - only for Authors */}
      {isAuthor() && (
        <Card>
          <CardHeader>
            <CardTitle>Create course</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <input
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-background rounded-md border px-3 py-2"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-background rounded-md border px-3 py-2"
            />
            <Button onClick={createCourse}>Create</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {getFilteredCourses().map(c => (
          <Card
            key={c.id}
            className={
              c.status === "ARCHIVED" && isAuthor() ? "opacity-60" : ""
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle
                  className={
                    c.status === "ARCHIVED" && isAuthor()
                      ? "text-muted-foreground"
                      : ""
                  }
                >
                  {c.title}
                  {c.status === "ARCHIVED" && isAuthor() && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (Archived)
                    </span>
                  )}
                </CardTitle>
                <Badge variant={getStatusBadgeVariant(c.status)}>
                  {c.status || "DRAFT"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{c.description}</p>

              {/* Department name for ADMIN and BASIC users */}
              {(user?.role === "ADMIN" || user?.role === "BASIC") &&
                c.departmentName && (
                  <div className="text-muted-foreground text-sm">
                    <span className="font-medium">Department:</span>{" "}
                    {c.departmentName}
                  </div>
                )}

              {/* Status Management for Authors */}
              {isAuthor() && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={c.status || "DRAFT"}
                    onValueChange={value => updateCourseStatus(c.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                {/* Manage button only for AUTHOR users */}
                {isAuthor() && (
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = `/courses/${c.id}`)}
                  >
                    Manage
                  </Button>
                )}
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
                {isAuthor() && (
                  <Button
                    variant="destructive"
                    disabled={!canDeleteCourse(c)}
                    onClick={() => handleDeleteClick(c.id, c.title)}
                  >
                    Delete
                  </Button>
                )}
              </div>

              {/* Warning message for courses with enrollments */}
              {isAuthor() && c.enrollmentCount > 0 && (
                <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                  <p className="text-sm text-yellow-800">
                    This course has active enrollments and cannot be deleted.
                    You may still archive the course.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteConfirmation.courseTitle}"? This action cannot be undone.`}
        confirmText="Delete Course"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
