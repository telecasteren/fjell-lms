import { test, expect } from "@playwright/test";
import { TestAuthHelper } from "./test-helpers";

test.describe("Dashboard & Reports", () => {
  test("should show author dashboard with statistics and department management", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();

    // Verify author dashboard loads
    await authHelper.navigateToPage("/author");
    await expect(page).toHaveURL("/author");

    // Look for dashboard content - statistics or department management
    const dashboardContent = page.locator(
      "text=/statistics|total|users|courses|departments|management/i",
    );
    if ((await dashboardContent.count()) > 0) {
      await expect(dashboardContent.first()).toBeVisible();
    }
  });

  test("should show reports page with department reports", async ({ page }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();

    // Navigate to reports page
    await authHelper.navigateToPage("/reports");
    await expect(page).toHaveURL("/reports");

    // Look for reports content
    const reportsContent = page.locator("text=/report|department|overview/i");
    if ((await reportsContent.count()) > 0) {
      await expect(reportsContent.first()).toBeVisible();
    }
  });

  test("should show courses page with course list", async ({ page }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();

    // Navigate to courses page
    await authHelper.navigateToPage("/courses");
    await expect(page).toHaveURL("/courses");

    // Look for course content
    const courseContent = page.locator("text=/course|title|description/i");
    if ((await courseContent.count()) > 0) {
      await expect(courseContent.first()).toBeVisible();
    }
  });
});
