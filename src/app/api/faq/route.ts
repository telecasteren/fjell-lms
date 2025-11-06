import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Define FAQ sections available for each role
    const faqSections = {
      BASIC: [
        {
          id: "getting-started",
          file: "getting-started.md",
          title: "Getting Started",
        },
        {
          id: "course-content",
          file: "course-content.md",
          title: "Course Content",
        },
        {
          id: "progress-tracking",
          file: "progress-tracking.md",
          title: "Progress Tracking",
        },
        {
          id: "technical-support",
          file: "technical-support.md",
          title: "Technical Support",
        },
      ],
      ADMIN: [
        {
          id: "getting-started",
          file: "getting-started.md",
          title: "Getting Started",
        },
        {
          id: "course-content",
          file: "course-content.md",
          title: "Course Content",
        },
        {
          id: "progress-tracking",
          file: "progress-tracking.md",
          title: "Progress Tracking",
        },
        {
          id: "technical-support",
          file: "technical-support.md",
          title: "Technical Support",
        },
        {
          id: "user-management",
          file: "user-management.md",
          title: "User Management",
        },
      ],
      AUTHOR: [
        {
          id: "getting-started",
          file: "getting-started.md",
          title: "Getting Started",
        },
        {
          id: "course-content",
          file: "course-content.md",
          title: "Course Content",
        },
        {
          id: "progress-tracking",
          file: "progress-tracking.md",
          title: "Progress Tracking",
        },
        {
          id: "technical-support",
          file: "technical-support.md",
          title: "Technical Support",
        },
        {
          id: "course-management",
          file: "course-management.md",
          title: "Course Management",
        },
        {
          id: "user-management",
          file: "user-management.md",
          title: "User Management",
        },
      ],
      WRITER: [
        {
          id: "getting-started",
          file: "getting-started.md",
          title: "Getting Started",
        },
        {
          id: "course-content",
          file: "course-content.md",
          title: "Course Content",
        },
        {
          id: "progress-tracking",
          file: "progress-tracking.md",
          title: "Progress Tracking",
        },
        {
          id: "technical-support",
          file: "technical-support.md",
          title: "Technical Support",
        },
        {
          id: "course-management",
          file: "course-management.md",
          title: "Course Management",
        },
      ],
    };

    const sections = faqSections[user.role] || faqSections.BASIC;
    const faqData = [];

    for (const section of sections) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          "faq",
          section.file
        );
        const content = fs.readFileSync(filePath, "utf8");

        // Extract title from first line (remove # and trim)
        const lines = content.split("\n");
        const title = lines[0].replace(/^#\s*/, "").trim();

        // Remove title from content
        const contentWithoutTitle = lines.slice(1).join("\n").trim();

        faqData.push({
          id: section.id,
          title,
          content: contentWithoutTitle,
        });
      } catch (error) {
        console.error(`Error reading FAQ file ${section.file}:`, error);
        // Continue with other sections even if one fails
      }
    }

    return NextResponse.json({ sections: faqData });
  } catch (error) {
    console.error("FAQ API error:", error);
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status: number }).status
        : 500;
    const message =
      error instanceof Error ? error.message : "Failed to fetch FAQ";
    return NextResponse.json({ error: message }, { status });
  }
}
