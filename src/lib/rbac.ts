import { getCurrentUser } from "./session";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

// Custom error class with status code
class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireAuth(req?: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireRole(allowedRoles: Role[], req?: NextRequest) {
  const user = await requireAuth(req);
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireAuthor(req?: NextRequest) {
  return await requireRole([Role.AUTHOR], req);
}

export async function requireAdminOrAuthor(req?: NextRequest) {
  return await requireRole([Role.AUTHOR, Role.ADMIN], req);
}

export async function requireAuthorOnly(req?: NextRequest) {
  return await requireRole([Role.AUTHOR], req);
}

export async function requireBasicOrAbove(req?: NextRequest) {
  return await requireRole([Role.AUTHOR, Role.ADMIN, Role.BASIC], req);
}

export async function requireWriter(req?: NextRequest) {
  return await requireRole([Role.WRITER], req);
}

export async function requireWriterOrAuthor(req?: NextRequest) {
  return await requireRole([Role.WRITER, Role.AUTHOR], req);
}

export async function requireWriterOrAdminOrAuthor(req?: NextRequest) {
  return await requireRole([Role.WRITER, Role.ADMIN, Role.AUTHOR], req);
}
