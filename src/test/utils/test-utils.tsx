import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { vi } from "vitest";

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock fetch
global.fetch = vi.fn();

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: Session | null;
  theme?: "light" | "dark";
}

function customRender(
  ui: ReactElement,
  {
    session = null,
    theme = "light",
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <ThemeProvider defaultTheme={theme}>
          <BrandingProvider>{children}</BrandingProvider>
        </ThemeProvider>
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock session data
export const mockSessions = {
  basic: {
    user: {
      id: "1",
      name: "Basic User",
      email: "basic@example.com",
      role: "BASIC",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  admin: {
    user: {
      id: "2",
      name: "Admin User",
      email: "admin@cubit.no",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  author: {
    user: {
      id: "3",
      name: "Author User",
      email: "author@cubit.no",
      role: "AUTHOR",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Mock API responses
export const mockApiResponses = {
  departments: {
    success: {
      departments: [
        { id: "1", name: "Cubit" },
        { id: "2", name: "Engineering" },
        { id: "3", name: "Marketing" },
      ],
    },
  },
  courses: {
    success: {
      courses: [
        {
          id: "1",
          title: "Introduction to LMS",
          description: "Learn the basics of our LMS",
          status: "PUBLISHED",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          title: "Advanced Features",
          description: "Explore advanced LMS features",
          status: "DRAFT",
          createdAt: "2024-01-02T00:00:00Z",
        },
      ],
    },
  },
  users: {
    success: {
      users: [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "BASIC",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "ADMIN",
          createdAt: "2024-01-02T00:00:00Z",
        },
      ],
    },
  },
};

// Helper functions
export const createMockFetch = (response: unknown, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
};

export const createMockFetchError = (message = "Network error") => {
  return vi.fn().mockRejectedValue(new Error(message));
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "BASIC",
  departmentId: "1",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createTestCourse = (overrides = {}) => ({
  id: "1",
  title: "Test Course",
  description: "A test course",
  status: "DRAFT",
  departmentId: "1",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createTestDepartment = (overrides = {}) => ({
  id: "1",
  name: "Test Department",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { mockRouter };
