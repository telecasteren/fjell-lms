import { z } from "zod";

// Password policy validation
export const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// User validation schemas
export const userRegistrationSchema = z
  .object({
    email: z.string().email("Invalid email format").max(255, "Email too long"),
    password: passwordPolicy,
    confirmPassword: z.string(),
    department: z.string().max(100, "Department name too long").optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const userUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .optional(),
  role: z.enum(["BASIC", "ADMIN", "AUTHOR"]).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordPolicy,
});

// Course validation schemas
export const courseCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
});

export const courseUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// Module validation schemas
export const moduleCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  order: z.number().int().min(0, "Order must be non-negative"),
});

export const moduleUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
});

// Lesson validation schemas
export const lessonCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().max(10000, "Content too long").optional(),
  order: z.number().int().min(0, "Order must be non-negative"),
});

export const lessonUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  content: z.string().max(10000, "Content too long").nullable().optional(),
  contentType: z.enum(["text", "scorm", "multimedia"]).optional(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
});

// Quiz validation schemas
export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z
    .string()
    .min(1, "Question is required")
    .max(500, "Question too long"),
  options: z
    .array(
      z.string().min(1, "Option cannot be empty").max(200, "Option too long")
    )
    .min(2, "At least 2 options required"),
  correctAnswers: z
    .array(z.number().int().min(0))
    .min(1, "At least 1 correct answer required"),
});

export const quizCreateSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .min(1, "At least 1 question required")
    .max(50, "Too many questions"),
});

// Enrollment validation schemas
export const enrollmentCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

// Progress validation schemas
export const progressUpdateSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  completed: z.boolean(),
});

// Department validation schemas
export const departmentCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Department name too long"),
});

// User reassignment validation schemas
export const userReassignmentSchema = z.object({
  departmentId: z.string().min(1, "Department ID is required"),
});

// Email validation schema
export const emailUpdateSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
});

// Helper function to validate request body
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false, error: errorMessage };
    }
    return { success: false, error: "Invalid request data" };
  }
}
