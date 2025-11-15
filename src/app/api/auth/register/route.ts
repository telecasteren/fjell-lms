import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { seedDefaultDepartment } from "@/lib/seed";
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
    simpleRateLimiters.registration,
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.error;
  }

  const body = await req.json();
  const validation = validateRequestBody(userRegistrationSchema, body);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }
  const { email, password, department } = validation.data;

  // Ensure default department exists
  await seedDefaultDepartment();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // If user exists but has placeholder password (created via department creation), update their password
    const isPlaceholderPassword = await bcrypt.compare(
      "PLACEHOLDER_PASSWORD",
      existing.passwordHash,
    );
    if (isPlaceholderPassword) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
        },
      });
      return successResponse({ message: "Password set successfully" });
    }
    throw new ConflictError("User already exists");
  }

  const dept = await prisma.department.upsert({
    where: { name: department },
    update: {},
    create: { name: department as string },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: null,
      email,
      passwordHash,
      role: Role.BASIC,
      departmentId: dept.id,
    },
  });

  return successResponse({ message: "User created successfully" });
});
