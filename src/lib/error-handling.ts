import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// Import AuthError for proper handling
class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

// Custom error types
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

// Error response interface
type ErrorDetails =
  | string
  | Array<{ field: string; message: string }>
  | Record<string, unknown>;

interface ErrorResponse {
  error: string;
  code?: string;
  details?: ErrorDetails;
  timestamp: string;
  path?: string;
}

interface ErrorContext {
  path?: string;
  userId?: string;
  [key: string]: unknown;
}

// Log error for monitoring
function logError(error: Error, context?: ErrorContext) {
  console.error("Application Error:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  });
}

// Handle different types of errors
export function handleError(error: unknown, request?: Request): NextResponse {
  const timestamp = new Date().toISOString();
  const path = request?.url;

  // Log the error
  logError(error instanceof Error ? error : new Error(String(error)), { path });

  // Handle AuthError specifically
  if (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status: number }).status === "number"
  ) {
    const authError = error as { message: string; status: number };
    return NextResponse.json(
      {
        error: authError.message || "Unauthorized",
      },
      { status: authError.status }
    );
  }

  // Handle known error types
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
      timestamp,
      path,
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
      })),
      timestamp,
      path,
    };

    return NextResponse.json(response, { status: 400 });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = "Database error";
    let statusCode = 500;

    switch (error.code) {
      case "P2002":
        message = "Resource already exists";
        statusCode = 409;
        break;
      case "P2025":
        message = "Resource not found";
        statusCode = 404;
        break;
      case "P2003":
        message = "Foreign key constraint failed";
        statusCode = 400;
        break;
      default:
        message = "Database operation failed";
    }

    const response: ErrorResponse = {
      error: message,
      code: "DATABASE_ERROR",
      timestamp,
      path,
    };

    return NextResponse.json(response, { status: statusCode });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      error: "Invalid data provided",
      code: "VALIDATION_ERROR",
      timestamp,
      path,
    };

    return NextResponse.json(response, { status: 400 });
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error instanceof Error
          ? error.message
          : "Unknown error",
    code: "INTERNAL_ERROR",
    timestamp,
    path,
  };

  return NextResponse.json(response, { status: 500 });
}

// Async error handler wrapper
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<Response | undefined>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const result = await handler(...args);
      // If handler returns undefined, return a generic 500 error
      if (!result) {
        return handleError(
          new Error("Handler returned undefined"),
          args[0] as Request
        );
      }
      return result;
    } catch {
      // Extract request from args if available
      const request = args.find(arg => arg instanceof Request) as
        | Request
        | undefined;
      return handleError(error, request);
    }
  };
}

// API route wrapper with error handling
export function apiHandler(
  handler: (
    request: Request,
    ...args: unknown[]
  ) => Promise<Response | undefined>
) {
  return withErrorHandling(handler);
}

// Success response helper
export function successResponse(
  data: unknown,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// Pagination response helper
export function paginatedResponse(
  data: unknown[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  });
}
