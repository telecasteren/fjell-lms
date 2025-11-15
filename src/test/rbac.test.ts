import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role, User } from "@prisma/client";

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

// Helper function to create complete mock user objects
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  emailVerified: null,
  image: null,
  passwordHash: "$2b$10$mockhashedpassword",
  role: Role.BASIC,
  departmentId: "test-department-id",
  theme: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

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
      const mockUser = createMockUser({ role: Role.BASIC });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAuth();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireRole", () => {
    it("throws error when user role is not allowed", async () => {
      const mockUser = createMockUser({ role: Role.BASIC });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireRole([Role.ADMIN, Role.AUTHOR])).rejects.toThrow(
        "Forbidden"
      );
    });

    it("returns user when role is allowed", async () => {
      const mockUser = createMockUser({ role: Role.ADMIN });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireRole([Role.ADMIN, Role.AUTHOR]);
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireAuthor", () => {
    it("throws error when user is not author", async () => {
      const mockUser = createMockUser({ role: Role.BASIC });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireAuthor()).rejects.toThrow("Forbidden");
    });

    it("returns user when user is author", async () => {
      const mockUser = createMockUser({ role: Role.AUTHOR });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAuthor();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireAdminOrAuthor", () => {
    it("throws error when user is basic", async () => {
      const mockUser = createMockUser({ role: Role.BASIC });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await expect(requireAdminOrAuthor()).rejects.toThrow("Forbidden");
    });

    it("returns user when user is admin", async () => {
      const mockUser = createMockUser({ role: Role.ADMIN });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAdminOrAuthor();
      expect(result).toEqual(mockUser);
    });

    it("returns user when user is author", async () => {
      const mockUser = createMockUser({ role: Role.AUTHOR });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await requireAdminOrAuthor();
      expect(result).toEqual(mockUser);
    });
  });

  describe("requireBasicOrAbove", () => {
    it("returns user for all roles", async () => {
      const roles = [Role.BASIC, Role.ADMIN, Role.AUTHOR];

      for (const role of roles) {
        const mockUser = createMockUser({ role });
        mockGetCurrentUser.mockResolvedValue(mockUser);

        const result = await requireBasicOrAbove();
        expect(result).toEqual(mockUser);
      }
    });
  });
});
