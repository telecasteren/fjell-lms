"use client";

import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { register, handleSubmit, watch, setValue } = useForm<{
    email: string;
    password: string;
    confirmPassword: string;
    department?: string;
  }>();
  const [loading, setLoading] = useState(false);

  const password = watch("password", "");

  // Password policy validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Pre-fill form with URL parameters
  useEffect(() => {
    const email = searchParams.get("email");

    if (email) {
      setValue("email", email);
    }

    // Note: Role is handled on the backend based on the user's existing record
  }, [searchParams, setValue]);

  const onSubmit = handleSubmit(async data => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Account created. You can now sign in.");
      // Redirect to sign-in page after successful registration
      setTimeout(() => {
        router.push("/sign-in");
      }, 1500);
    } else {
      toast.error("Could not create account.");
    }
  });

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                className="bg-background w-full rounded-md border px-3 py-2"
                {...register("email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <input
                id="password"
                type="password"
                className="bg-background w-full rounded-md border px-3 py-2"
                {...register("password")}
              />
              {password && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {passwordChecks.length ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordChecks.length
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.uppercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordChecks.uppercase
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.lowercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordChecks.lowercase
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.number ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordChecks.number
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.special ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordChecks.special
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      One special character
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <input
                id="confirmPassword"
                type="password"
                className="bg-background w-full rounded-md border px-3 py-2"
                {...register("confirmPassword")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <input
                id="department"
                type="text"
                className="bg-background w-full rounded-md border px-3 py-2"
                placeholder="Enter department name (optional)"
                {...register("department")}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full"
            >
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
