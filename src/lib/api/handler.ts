import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Permission } from "@/lib/permissions";
import { isAuthError, requirePermission } from "@/lib/rbac";

type HandlerResult = Response | NextResponse;

type ApiHandlerOptions = {
  permission?: Permission;
};

export function withApiHandler(
  handler: (req: NextRequest) => Promise<HandlerResult>,
  options: ApiHandlerOptions = {},
) {
  return async function apiHandler(req: NextRequest): Promise<HandlerResult> {
    try {
      if (options.permission) {
        await requirePermission(options.permission, req);
      }
      return await handler(req);
    } catch (error) {
      if (isAuthError(error)) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
