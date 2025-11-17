import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { userRegistrationSchema, validateRequestBody } from "@/lib/validation";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import { simpleRateLimiters } from "@/lib/simple-rate-limit";
import {
  apiHandler,
  successResponse,
  ConflictError,
  ValidationError,
} from "@/lib/error-handling";

export const POST = apiHandler(async (req: Request) => {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(
    req,
    rateLimiters.registration,
    undefined,
    simpleRateLimiters.registration
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.error;
  }

  const body = await req.json();
  const validation = validateRequestBody(userRegistrationSchema, body);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }
  const { email, password, token } = validation.data;

  // Check if user already exists first
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (token.startsWith("legacy")) {
    // Legacy flow - extract role from token or default to BASIC
    let userRole = "BASIC";
    if (token.includes(":")) {
      const roleFromToken = token.split(":")[1];
      if (["BASIC", "ADMIN", "WRITER", "AUTHOR"].includes(roleFromToken)) {
        userRole = roleFromToken;
      }
    }

    const defaultDept = await prisma.department.findFirst({
      where: { name: "FOX-LMS" },
    });

    if (!defaultDept) {
      throw new ValidationError("Default department not found");
    }

    // Use transaction to create user and clean up any pending invitations
    await prisma.$transaction(async (tx) => {
      // Create the user
      await tx.user.create({
        data: {
          name: null,
          email,
          passwordHash,
          role: userRole as "BASIC" | "ADMIN" | "WRITER" | "AUTHOR",
          departmentId: defaultDept.id,
        },
      });

      // Clean up any pending invitations for this email
      await tx.invitation.updateMany({
        where: {
          email,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });
  } else {
    // New invitation token flow
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        department: true,
      },
    });

    if (!invitation) {
      throw new ValidationError("Invalid or expired invitation token");
    }

    // Verify email matches invitation
    if (invitation.email !== email) {
      throw new ValidationError("Email does not match invitation");
    }

    // Create user and mark invitation as accepted
    await prisma.$transaction(async (tx) => {
      // Create the user
      await tx.user.create({
        data: {
          name: null,
          email,
          passwordHash,
          role: invitation.role,
          departmentId: invitation.departmentId,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });
  }

  return successResponse({ message: "User created successfully" });
});
