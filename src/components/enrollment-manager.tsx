"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Enrollment = {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  departmentId?: string;
};

type Course = {
  id: string;
  title: string;
  departmentId?: string;
};

type EnrollmentManagerProps = {
  selectedDepartment?: string;
  currentDepartment?: string;
  allUsers?: User[];
  allCourses?: Course[];
};

export function EnrollmentManager({
  selectedDepartment,
  currentDepartment,
  allUsers = [],
  allCourses = [],
}: EnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    courseId: "",
  });

  useEffect(() => {
    loadData();
  }, [selectedDepartment, currentDepartment, allUsers, allCourses]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    // Load enrollments
    const enrollRes = await fetch("/api/admin/enrollments");
    if (enrollRes.ok) {
      const enrollData = await enrollRes.json();
      setEnrollments(enrollData.enrollments);
    }

    // If props are provided, use filtered data instead of API calls
    if (allUsers.length > 0 && allCourses.length > 0) {
      const targetDepartmentId = selectedDepartment || currentDepartment;

      // Filter users by department
      const departmentUsers = targetDepartmentId
        ? allUsers.filter((user) => user.departmentId === targetDepartmentId)
        : allUsers;

      // Filter courses by department
      const departmentCourses = targetDepartmentId
        ? allCourses.filter(
            (course) => course.departmentId === targetDepartmentId
          )
        : allCourses;

      setUsers(departmentUsers);
      setCourses(departmentCourses);
      return;
    }

    // Fallback to API calls if no props provided
    const usersRes = await fetch("/api/admin/users");
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData.users);
    }

    const coursesRes = await fetch("/api/admin/courses");
    if (coursesRes.ok) {
      const coursesData = await coursesRes.json();
      setCourses(coursesData.courses);
    }
  }

  async function createEnrollment() {
    if (!formData.userId || !formData.courseId) return;

    setLoading(true);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);

    if (res.ok) {
      setFormData({ userId: "", courseId: "" });
      await loadData();
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <select
              id="user"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <select
              id="course"
              value={formData.courseId}
              onChange={(e) =>
                setFormData({ ...formData, courseId: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          onClick={createEnrollment}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Enrolling..." : "Enroll User"}
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Current Enrollments</h4>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments yet.</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <div>
                  <span className="font-medium">{enrollment.user.name}</span>{" "}
                  enrolled in{" "}
                  <span className="font-medium">{enrollment.course.title}</span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(enrollment.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
