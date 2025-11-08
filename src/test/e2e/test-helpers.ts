import { Page } from "@playwright/test";

export class TestAuthHelper {
  constructor(private page: Page) {}

  async signInAsAuthor() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    // Reduced wait time for better performance
    await this.page.waitForTimeout(200);

    await this.page.getByLabel("Email").fill("author@example.com");
    await this.page.getByLabel("Password").fill("test321");
    await this.page.getByRole("button", { name: "Sign in" }).click();

    // Simplified navigation wait with reduced timeout
    await this.page.waitForURL(url => !url.toString().includes("/sign-in"), {
      timeout: 5000,
    });

    // Quick session verification
    await this.verifySession();
  }

  async signInAsAdmin() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    await this.page.getByLabel("Email").fill("admin@example.com");
    await this.page.getByLabel("Password").fill("test321");
    await this.page.getByRole("button", { name: "Sign in" }).click();

    await this.page.waitForURL(url => !url.toString().includes("/sign-in"), {
      timeout: 5000,
    });
    await this.verifySession();
  }

  async signInAsBasic() {
    await this.page.goto("/sign-in");
    await this.page.waitForLoadState("domcontentloaded");

    await this.page.getByLabel("Email").fill("basic@example.com");
    await this.page.getByLabel("Password").fill("test321");
    await this.page.getByRole("button", { name: "Sign in" }).click();

    await this.page.waitForURL(url => !url.toString().includes("/sign-in"), {
      timeout: 5000,
    });
    await this.verifySession();
  }

  async verifySession() {
    // Simplified session verification with reduced timeout
    await this.page.waitForFunction(
      async () => {
        try {
          const response = await fetch("/api/auth/session", {
            credentials: "include",
          });
          const session = await response.json();
          return session && Object.keys(session).length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 3000 }
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
