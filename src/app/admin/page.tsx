"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EnrollmentManager } from "@/components/enrollment-manager";
import { AdminUserEditModal } from "@/components/admin-user-edit-modal";
import { UserReassignmentModal } from "@/components/user-reassignment-modal";
import { DepartmentBrandingSettings } from "@/components/department-branding-settings";
import { DepartmentCreationModal } from "@/components/department-creation-modal";
import { DepartmentSearchInput } from "@/components/department-search-input";
import { UserSearchInput } from "@/components/user-search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users, BookOpen, Building2, Link } from "lucide-react";
import toast from "react-hot-toast";
import { getSignUpUrl } from "@/lib/url";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  createdAt: string;
};

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
  appDescription?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: {
    id: string;
    name: string;
  } | null;
  footerLinkSectionTitle?: string | null;
  footerLink1Url?: string | null;
  footerLink1Text?: string | null;
  footerLink2Url?: string | null;
  footerLink2Text?: string | null;
  footerLink3Url?: string | null;
  footerLink3Text?: string | null;
  footerContactEmail?: string | null;
  footerContactPhone?: string | null;
  footerContactAddress?: string | null;
  footerContactAddress2?: string | null;
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

type DepartmentStats = {
  department: {
    id: string;
    name: string;
    orgNr: string | null;
    logoUrl?: string | null;
    darkModeLogoUrl?: string | null;
    logoText?: string | null;
    appDescription?: string | null;
    parentDepartmentId?: string | null;
    parentDepartment?: {
      id: string;
      name: string;
    } | null;
    footerLinkSectionTitle?: string | null;
    footerLink1Url?: string | null;
    footerLink1Text?: string | null;
    footerLink2Url?: string | null;
    footerLink2Text?: string | null;
    footerLink3Url?: string | null;
    footerLink3Text?: string | null;
    footerContactEmail?: string | null;
    footerContactPhone?: string | null;
    footerContactAddress?: string | null;
    footerContactAddress2?: string | null;
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentDetails, setDepartmentDetails] =
    useState<DepartmentDetails | null>(null);
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [configureUserSearchQuery, setConfigureUserSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showConfigure, setShowConfigure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
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
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentDetails(selectedDepartment);
    } else {
      setDepartmentDetails(null);
    }
  }, [selectedDepartment]);

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
      // Set selected department to current department if not set
      if (!selectedDepartment && data.department) {
        setSelectedDepartment(data.department.id);
      }
    }
  }

  async function loadDepartments() {
    const res = await fetch("/api/departments", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setDepartments(data.departments || []);
    }
  }

  async function loadDepartmentDetails(departmentId: string) {
    const res = await fetch(`/api/author/departments/${departmentId}`, {
      credentials: "include",
    });
    if (res.ok) {
      const deptData = await res.json();
      setDepartmentDetails(deptData.department);
    }
  }

  function handleUserUpdate() {
    if (selectedDepartment) {
      loadDepartmentDetails(selectedDepartment);
    }
    loadUsers();
    loadDepartmentStats();
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

  // Check if user is an ADMIN in a child department of FOX-LMS
  const canCreateDepartment = 
    currentUserRole === "ADMIN" && 
    departmentStats?.department?.parentDepartment?.name === "FOX-LMS";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Department Management</h1>
        <div className="flex items-center gap-2">
          {canCreateDepartment && (
            <Button
              variant="outline"
              onClick={() => setShowCreateDepartment(true)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>Add User</Button>
        </div>
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

      {/* Department Selection - Only show if user has access to multiple departments */}
      {departments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Select Department:</span>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setDepartmentSearchQuery("");
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departmentSearchQuery.trim()
                      ? departments.filter(dept =>
                          dept.name
                            .toLowerCase()
                            .includes(departmentSearchQuery.toLowerCase().trim())
                        )
                      : departments
                    ).map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept._count.users} users,{" "}
                        {dept._count.courses} courses)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DepartmentSearchInput
                  value={departmentSearchQuery}
                  onChange={(value) => {
                    setDepartmentSearchQuery(value);
                    const filtered = departments.filter(dept =>
                      dept.name.toLowerCase().includes(value.toLowerCase().trim())
                    );
                    if (filtered.length === 1 && value.trim()) {
                      setSelectedDepartment(filtered[0].id);
                    } else if (value.trim() === "") {
                      setSelectedDepartment("");
                      setDepartmentDetails(null);
                    }
                  }}
                  placeholder="Search departments..."
                />
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
                  <div className="flex justify-end gap-4">
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
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-lg font-semibold">
                                User List
                              </h3>
                            </div>
                            <div className="mb-3">
                              <UserSearchInput
                                value={configureUserSearchQuery}
                                onChange={setConfigureUserSearchQuery}
                                placeholder="Search users by name or email..."
                              />
                            </div>
                            <div className="space-y-2">
                              {departmentDetails.users
                                .filter(user => {
                                  if (!configureUserSearchQuery.trim()) return true;
                                  const query = configureUserSearchQuery.toLowerCase();
                                  return (
                                    (user.name && user.name.toLowerCase().includes(query)) ||
                                    (user.email && user.email.toLowerCase().includes(query))
                                  );
                                })
                                .map(user => (
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
                                    <AdminUserEditModal
                                      user={user}
                                      onUserUpdate={handleUserUpdate}
                                      currentUserRole={currentUserRole}
                                    />
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
                              currentAppDescription={departmentDetails.appDescription}
                              currentDarkModeLogoUrl={departmentDetails.darkModeLogoUrl}
                              currentFooterLinkSectionTitle={departmentDetails.footerLinkSectionTitle}
                              currentFooterLink1Url={departmentDetails.footerLink1Url}
                              currentFooterLink1Text={departmentDetails.footerLink1Text}
                              currentFooterLink2Url={departmentDetails.footerLink2Url}
                              currentFooterLink2Text={departmentDetails.footerLink2Text}
                              currentFooterLink3Url={departmentDetails.footerLink3Url}
                              currentFooterLink3Text={departmentDetails.footerLink3Text}
                              currentFooterContactEmail={departmentDetails.footerContactEmail}
                              currentFooterContactPhone={departmentDetails.footerContactPhone}
                              currentFooterContactAddress={departmentDetails.footerContactAddress}
                              currentFooterContactAddress2={departmentDetails.footerContactAddress2}
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
                      <option value="WRITER">Writer</option>
                      <option value="AUTHOR">Author</option>
                    </>
                  ) : (
                    <>
                      <option value="BASIC">Basic User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="WRITER">Writer</option>
                    </>
                  )}
                </select>
                {currentUserRole === "ADMIN" && (
                  <p className="text-muted-foreground text-xs">
                    ADMIN users can only create BASIC, ADMIN, or WRITER users
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sign-up Link</Label>
              <div className="flex items-center gap-2">
                <input
                  value={getSignUpUrl(formData.email, formData.role)}
                  readOnly
                  className="bg-background w-full rounded-md border px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const signupUrl = getSignUpUrl(formData.email, formData.role);
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
            <div className="mb-4">
              <UserSearchInput
                value={userSearchQuery}
                onChange={(value) => {
                  setUserSearchQuery(value);
                  // Auto-expand if there are search results
                  if (value.trim()) {
                    const query = value.toLowerCase();
                    const filteredUsers = users.filter(user => {
                      return (
                        (user.name && user.name.toLowerCase().includes(query)) ||
                        (user.email && user.email.toLowerCase().includes(query))
                      );
                    });
                    if (filteredUsers.length > 0) {
                      setShowAllUsers(true);
                    }
                  }
                }}
                placeholder="Search users by name or email..."
              />
            </div>
            <div className="space-y-3">
              {(() => {
                const filteredUsers = users.filter(user => {
                  if (!userSearchQuery.trim()) return true;
                  const query = userSearchQuery.toLowerCase();
                  return (
                    (user.name && user.name.toLowerCase().includes(query)) ||
                    (user.email && user.email.toLowerCase().includes(query))
                  );
                });
                const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 3);
                
                return (
                  <>
                    {displayedUsers.map(user => (
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
                    {!showAllUsers && filteredUsers.length > 3 && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllUsers(true)}
                          className="w-full"
                        >
                          See all ({filteredUsers.length} users)
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
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

      {/* Department Creation Modal */}
      {showCreateDepartment && departmentStats && (
        <DepartmentCreationModal
          isOpen={showCreateDepartment}
          onClose={() => setShowCreateDepartment(false)}
          onDepartmentCreated={() => {
            setShowCreateDepartment(false);
            loadDepartmentStats();
            toast.success("Department created successfully");
          }}
          defaultParentDepartmentId={departmentStats.department.id}
        />
      )}
    </div>
  );
}
