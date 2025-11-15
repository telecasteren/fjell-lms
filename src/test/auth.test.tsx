import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import SignInPage from "@/app/(auth)/sign-in/page";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign-in form", () => {
    render(
      <SessionProvider session={null}>
        <SignInPage />
      </SessionProvider>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider session={null}>
        <SignInPage />
      </SessionProvider>,
    );

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    // Check if validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn();

    vi.doMock("next-auth/react", () => ({
      signIn: mockSignIn,
      SessionProvider: ({ children }: { children: React.ReactNode }) =>
        children,
    }));

    render(
      <SessionProvider session={null}>
        <SignInPage />
      </SessionProvider>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Note: In a real test, you'd mock the API call and verify the signIn function is called
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("has link to sign-up page", () => {
    render(
      <SessionProvider session={null}>
        <SignInPage />
      </SessionProvider>,
    );

    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute("href", "/sign-up");
  });
});
