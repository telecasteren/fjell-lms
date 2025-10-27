import { test, expect } from "@playwright/test";
import { TestAuthHelper } from "./test-helpers";

test.describe("Authentication Flow", () => {
  test("should display sign-in page with form elements", async ({ page }) => {
    await page.goto("/sign-in");

    // Check if sign-in form elements are present
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/sign-in");

    // Click sign in without filling form
    await page.getByRole("button", { name: "Sign in" }).click();

    // Check for validation errors
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should navigate between sign-in and sign-up pages", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    // Navigate to sign-up page
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/sign-up");

    // Verify sign-up form elements
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password").first()).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByLabel("Department (Optional)")).toBeVisible();
  });

  test("should redirect to dashboard after successful sign-in", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);

    // Use the test helper to sign in
    await authHelper.signInAsAuthor();

    // AUTHOR users get redirected to /author
    await expect(page).toHaveURL("/author");
  });
});

test.describe("Navigation & Authorization", () => {
  test("should show sidebar navigation for authenticated users", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);

    // Sign in first
    await authHelper.signInAsAuthor();

    // Check if sidebar is visible (look for navigation elements)
    await expect(page.locator("nav")).toBeVisible();
  });
});
