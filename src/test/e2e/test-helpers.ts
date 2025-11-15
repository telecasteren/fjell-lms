import { Page } from "@playwright/test";

export class TestAuthHelper {
  constructor(private page: Page) {}

  async signInAsAuthor() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    // Fill form fields first
    await this.page.getByLabel("Email").fill("author@example.com");
    await this.page.getByLabel("Password").first().fill("test321");

    // Wait for button to be enabled (form validation may disable it initially)
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        return button && !button.disabled;
      },
      { timeout: 3000 },
    );

    await this.page.getByRole("button", { name: "Sign in" }).click();

    // Wait for navigation away from sign-in page
    await this.page.waitForURL((url) => !url.toString().includes("/sign-in"), {
      timeout: 10000,
    });

    // Quick session verification
    await this.verifySession();
  }

  async signInAsAdmin() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    // Fill form fields first
    await this.page.getByLabel("Email").fill("admin@example.com");
    await this.page.getByLabel("Password").first().fill("test321");

    // Wait for button to be enabled
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        return button && !button.disabled;
      },
      { timeout: 3000 },
    );

    await this.page.getByRole("button", { name: "Sign in" }).click();

    await this.page.waitForURL((url) => !url.toString().includes("/sign-in"), {
      timeout: 10000,
    });
    await this.verifySession();
  }

  async signInAsBasic() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    // Fill form fields first
    await this.page.getByLabel("Email").fill("basic@example.com");
    await this.page.getByLabel("Password").first().fill("test321");

    // Wait for button to be enabled
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        return button && !button.disabled;
      },
      { timeout: 3000 },
    );

    await this.page.getByRole("button", { name: "Sign in" }).click();

    await this.page.waitForURL((url) => !url.toString().includes("/sign-in"), {
      timeout: 10000,
    });
    await this.verifySession();
  }

  async verifySession() {
    // Verify session by checking for authenticated user data
    await this.page.waitForFunction(
      async () => {
        try {
          const response = await fetch("/api/session", {
            credentials: "include",
          });
          if (response.status === 200) {
            const session = await response.json();
            return session && session.user && session.user.email;
          }
          return false;
        } catch {
          return false;
        }
      },
      { timeout: 5000 },
    );
  }

  async navigateToPage(path: string) {
    // Simplified navigation with single attempt and reduced timeout
    await this.page.goto(path, {
      waitUntil: "domcontentloaded",
      timeout: 5000,
    });
  }

  async signOut() {
    // Look for sign out button/link in the UI
    const signOutButton = this.page.getByRole("button", {
      name: /sign out|logout/i,
    });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    }
  }
}

export async function setupTestData() {
  // This would set up test data in the database
  // For now, we'll rely on existing test data
  console.log("Test data setup - using existing data");
}

export async function cleanupTestData() {
  // This would clean up test data after tests
  console.log("Test data cleanup");
}
