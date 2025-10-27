import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";

// Mock the session and auth functions
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Import the functions after mocking
import {
  requireAuth,
  requireRole,
  requireAuthor,
  requireAdminOrAuthor,
  requireBasicOrAbove,
} from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";

const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe("RBAC Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("throws error when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("returns user when authenticated", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.BASIC };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAuth();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireRole", () => {
    it("throws error when user role is not allowed", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.BASIC };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireRole([Role.ADMIN, Role.AUTHOR])).rejects.toThrow(
        "Forbidden"
      );
    });

    it("returns user when role is allowed", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.ADMIN };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireRole([Role.ADMIN, Role.AUTHOR]);
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireAuthor", () => {
    it("throws error when user is not author", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.BASIC };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireAuthor()).rejects.toThrow("Forbidden");
    });

    it("returns user when user is author", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: Role.AUTHOR,
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAuthor();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireAdminOrAuthor", () => {
    it("throws error when user is basic", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.BASIC };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireAdminOrAuthor()).rejects.toThrow("Forbidden");
    });

    it("returns user when user is admin", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: Role.ADMIN };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAdminOrAuthor();
      expect(result).toEqual(mockUser);
    });

    it("returns user when user is author", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: Role.AUTHOR,
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAdminOrAuthor();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireBasicOrAbove", () => {
    it("returns user for all roles", async () => {
      const roles = [Role.BASIC, Role.ADMIN, Role.AUTHOR];

      for (const role of roles) {
        const mockUser = { id: "1", email: "test@example.com", role };
        mockGetCurrentUser.mockResolvedValue(mockUser);

        const result = await requireBasicOrAbove();
        expect(result).toEqual(mockUser);
      }
    });
  });
});
