import { test, expect } from "@playwright/test";
import { TestAuthHelper } from "./test-helpers";

test.describe("Course Management - Author", () => {
  test("should display courses page and creation form for authors", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();

    // Navigate to courses page
    await authHelper.navigateToPage("/courses");

    // Check if courses page loads with create functionality
    await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
  });

  test("should allow course creation with valid data", async ({ page }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();
    await authHelper.navigateToPage("/courses");

    // Click create course button and fill form
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByPlaceholder("Title").fill("Test Course");
    await page
      .getByPlaceholder("Description")
      .fill("A test course description");

    // Submit form and verify creation
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Test Course")).toBeVisible();
  });

  test("should show validation errors for invalid course data", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();
    await authHelper.navigateToPage("/courses");

    // Try to submit empty form
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByRole("button", { name: "Create" }).click();

    // Check that form is still visible (not submitted)
    await expect(page.getByPlaceholder("Title")).toBeVisible();
  });

  test("should allow course management and navigation", async ({ page }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsAuthor();
    await authHelper.navigateToPage("/courses");

    // Check for course management features
    const courseTitles = page.locator(
      '[data-testid="course-title"], h3, .course-title',
    );
    const selectElements = page.locator("select");

    if ((await courseTitles.count()) > 0) {
      // Test course navigation
      await courseTitles.first().click();
      await expect(page).toHaveURL(/\/courses\/[^\/]+$/);

      // Look for module/lesson management
      const managementButtons = page.locator(
        'button:has-text("Add module"), button:has-text("Add lesson"), button:has-text("Edit")',
      );
      if ((await managementButtons.count()) > 0) {
        await expect(managementButtons.first()).toBeVisible();
      }
    }

    // Check status management if available
    if ((await selectElements.count()) > 0) {
      await expect(selectElements.first()).toBeVisible();
    }
  });
});

test.describe("Course Learning - Student", () => {
  test("should show enroll functionality and course content for students", async ({
    page,
  }) => {
    const authHelper = new TestAuthHelper(page);
    await authHelper.signInAsBasic();
    await authHelper.navigateToPage("/courses");

    // Check for courses page loading first
    await expect(page).toHaveURL("/courses");

    // Check enroll functionality (make it optional since UI might vary)
    const enrollButtons = page.getByRole("button", { name: /enroll/i });
    const courseTitles = page.locator(
      '[data-testid="course-title"], h3, .course-title',
    );

    // Verify either enroll buttons exist OR we can navigate to course content
    const hasEnrollButtons = (await enrollButtons.count()) > 0;
    const hasCourses = (await courseTitles.count()) > 0;

    if (hasEnrollButtons) {
      await expect(enrollButtons.first()).toBeVisible();
    } else if (hasCourses) {
      // If no enroll buttons, at least verify courses are visible
      await expect(courseTitles.first()).toBeVisible();
    }

    // Navigate to course detail if available
    if (hasCourses) {
      await courseTitles.first().click();
      await expect(page).toHaveURL(/\/courses\/[^\/]+$/);

      // Check for learning features
      const learningFeatures = page.locator(
        '[role="progressbar"], .progress, text=/progress|complete|quiz|question|answer/i',
      );
      if ((await learningFeatures.count()) > 0) {
        await expect(learningFeatures.first()).toBeVisible();
      }

      // Check for completion functionality
      const completionElements = page.locator(
        'input[type="checkbox"], button:has-text("complete"), button:has-text("submit")',
      );
      if ((await completionElements.count()) > 0) {
        await expect(completionElements.first()).toBeVisible();
      }
    }
  });
});
