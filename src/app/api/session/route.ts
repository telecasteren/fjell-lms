import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { withApiHandler } from "@/lib/api/handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      image: user.image,
    },
  });
});
