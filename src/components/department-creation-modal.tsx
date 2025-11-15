"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Trash2, Link, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getSignUpUrl } from "@/lib/url";

interface DepartmentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentCreated: () => void;
  defaultParentDepartmentId?: string;
}

interface NewUser {
  name: string;
  email: string;
  role: "BASIC" | "ADMIN" | "WRITER";
  userId?: string; // For existing users
  isExisting?: boolean;
  originalRole?: string; // For AUTHOR users
}

interface ExistingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
}

export function DepartmentCreationModal({
  isOpen,
  onClose,
  onDepartmentCreated,
  defaultParentDepartmentId,
}: DepartmentCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [orgNr, setOrgNr] = useState("");
  const [users, setUsers] = useState<NewUser[]>([
    { name: "", email: "", role: "BASIC", isExisting: false },
  ]);

  // User search state
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);
  const [searchResults, setSearchResults] = useState<ExistingUser[][]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartmentName("");
      setOrgNr("");
      setUsers([{ name: "", email: "", role: "BASIC", isExisting: false }]);
      setSearchQueries([""]);
      setSearchResults([[]]);
      setShowSearchResults([false]);
      setSearchLoading([false]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addUser = () => {
    setUsers([
      ...users,
      { name: "", email: "", role: "BASIC", isExisting: false },
    ]);
    setSearchQueries([...searchQueries, ""]);
    setSearchResults([...searchResults, []]);
    setShowSearchResults([...showSearchResults, false]);
    setSearchLoading([...searchLoading, false]);
  };

  const removeUser = (index: number) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
      setSearchQueries(searchQueries.filter((_, i) => i !== index));
      setSearchResults(searchResults.filter((_, i) => i !== index));
      setShowSearchResults(showSearchResults.filter((_, i) => i !== index));
      setSearchLoading(searchLoading.filter((_, i) => i !== index));
    }
  };

  // Search for users
  const searchUsers = async (index: number, query: string) => {
    const newQueries = [...searchQueries];
    newQueries[index] = query;
    setSearchQueries(newQueries);

    if (query.length < 2) {
      const newResults = [...searchResults];
      newResults[index] = [];
      setSearchResults(newResults);

      const newShow = [...showSearchResults];
      newShow[index] = false;
      setShowSearchResults(newShow);
      return;
    }

    const newLoading = [...searchLoading];
    newLoading[index] = true;
    setSearchLoading(newLoading);

    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        const newResults = [...searchResults];
        newResults[index] = data.users || [];
        setSearchResults(newResults);

        const newShow = [...showSearchResults];
        newShow[index] = true;
        setShowSearchResults(newShow);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search users");
    } finally {
      const newLoading = [...searchLoading];
      newLoading[index] = false;
      setSearchLoading(newLoading);
    }
  };

  // Select existing user
  const selectExistingUser = (index: number, user: ExistingUser) => {
    const updatedUsers = [...users];

    // Store the user's original role
    const originalRole = user.role;

    // Use "ADMIN" as default role for display purposes (will be preserved on reassignment)
    const displayRole =
      user.role === "BASIC" || user.role === "ADMIN" || user.role === "WRITER" || user.role === "AUTHOR"
        ? user.role
        : "BASIC";

    updatedUsers[index] = {
      name: user.name,
      email: user.email,
      role: displayRole as "BASIC" | "ADMIN" | "WRITER",
      userId: user.id,
      isExisting: true,
      originalRole: originalRole,
    };
    setUsers(updatedUsers);

    // Hide search results
    const newShow = [...showSearchResults];
    newShow[index] = false;
    setShowSearchResults(newShow);

    toast.success(`Added ${user.name} from ${user.department.name}`);
  };

  const updateUser = (index: number, field: keyof NewUser, value: string) => {
    const updatedUsers = [...users];
    updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    setUsers(updatedUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      toast.error("Department name is required");
      return;
    }

    // Validate users - separate existing and new users
    const validUsers = users.filter(
      user => user.name.trim() && user.email.trim()
    );

    if (validUsers.length === 0) {
      toast.error("At least one user is required");
      return;
    }

    // Check for duplicate emails
    const emails = validUsers.map(u => u.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      toast.error("Duplicate email addresses found");
      return;
    }

    // Separate existing users and new users
    const existingUsers = validUsers.filter(u => u.isExisting);
    const newUsers = validUsers.filter(u => !u.isExisting);

    setLoading(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: departmentName.trim(),
          orgNr: orgNr.trim() || null,
          parentDepartmentId: defaultParentDepartmentId || null,
          users: newUsers,
          existingUsers: existingUsers.map(u => ({ userId: u.userId })),
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Department created successfully");
        setDepartmentName("");
        setOrgNr("");
        setUsers([{ name: "", email: "", role: "BASIC" }]);
        onDepartmentCreated();
        onClose();
      } else {
        const error = await res.json();
        console.error("Department creation error:", error);
        toast.error(
          error.details || error.error || "Failed to create department"
        );
      }
    } catch {
      toast.error("Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Create New Department</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Department Information</h3>
              <div className="space-y-2">
                <Label htmlFor="departmentName">Company Name *</Label>
                <Input
                  id="departmentName"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgNr">Organization Number</Label>
                <Input
                  id="orgNr"
                  value={orgNr}
                  onChange={e => setOrgNr(e.target.value)}
                  placeholder="Enter organization number (optional)"
                />
              </div>
            </div>

            {/* Users */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Users</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUser}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>

              {users.map((user, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">User {index + 1}</h4>
                      {users.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Search for existing users */}
                    <div className="space-y-2">
                      <Label htmlFor={`search-${index}`}>
                        Search for existing user (optional)
                      </Label>
                      <div className="relative">
                        <Input
                          id={`search-${index}`}
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchQueries[index] || ""}
                          onChange={e => searchUsers(index, e.target.value)}
                          onFocus={() =>
                            searchQueries[index] &&
                            searchQueries[index].length >= 2 &&
                            setShowSearchResults(() => {
                              const newShow = [...showSearchResults];
                              newShow[index] = true;
                              return newShow;
                            })
                          }
                          disabled={user.isExisting}
                          className="pr-10"
                        />
                        <Search className="text-muted-foreground absolute top-3 right-3 h-4 w-4" />
                      </div>

                      {/* Search results dropdown */}
                      {showSearchResults[index] &&
                        searchResults[index] &&
                        searchResults[index].length > 0 && (
                          <div className="max-h-48 overflow-y-auto rounded-md border">
                            {searchResults[index].map(result => (
                              <div
                                key={result.id}
                                className="hover:bg-muted cursor-pointer border-b p-3 last:border-b-0"
                                onClick={() =>
                                  selectExistingUser(index, result)
                                }
                              >
                                <p className="font-medium">{result.name}</p>
                                <p className="text-muted-foreground text-sm">
                                  {result.email}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Current: {result.department.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Loading state */}
                      {searchLoading[index] && (
                        <p className="text-muted-foreground text-sm">
                          Searching...
                        </p>
                      )}

                      {/* No results */}
                      {showSearchResults[index] &&
                        searchResults[index] &&
                        searchResults[index].length === 0 &&
                        searchQueries[index].length >= 2 && (
                          <p className="text-muted-foreground text-sm">
                            No users found
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`}>Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={user.name}
                          onChange={e =>
                            updateUser(index, "name", e.target.value)
                          }
                          placeholder="Enter full name"
                          readOnly={user.isExisting}
                          className={user.isExisting ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email *</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={user.email}
                          onChange={e =>
                            updateUser(index, "email", e.target.value)
                          }
                          placeholder="Enter email address"
                          readOnly={user.isExisting}
                          className={user.isExisting ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`role-${index}`}>Role</Label>
                        <select
                          id={`role-${index}`}
                          value={user.originalRole || user.role}
                          onChange={e =>
                            updateUser(
                              index,
                              "role",
                              e.target.value as "BASIC" | "ADMIN" | "WRITER"
                            )
                          }
                          disabled={user.isExisting}
                          className={`border-input bg-background ring-offset-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${user.isExisting ? "bg-muted" : ""}`}
                        >
                          <option value="BASIC">Basic User</option>
                          <option value="ADMIN">Admin</option>
                          <option value="WRITER">Writer</option>
                          {user.originalRole && (
                            <option value={user.originalRole}>
                              {user.originalRole === "AUTHOR"
                                ? "Author"
                                : user.originalRole}
                            </option>
                          )}
                        </select>
                        {user.isExisting && (
                          <p className="text-muted-foreground text-xs">
                            Existing users keep their current role upon
                            reassignment ({user.originalRole || user.role})
                          </p>
                        )}
                      </div>
                      {!user.isExisting && (
                        <div className="space-y-2">
                          <Label>Sign-up Link</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={getSignUpUrl(user.email, user.role)}
                              readOnly
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const signupUrl = getSignUpUrl(user.email, user.role);
                                navigator.clipboard.writeText(signupUrl);
                                toast.success(
                                  "Sign-up link copied to clipboard"
                                );
                              }}
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Copy this link and send it to the user to complete
                            their registration
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Department"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
