import { NextRequest } from "next/server";
import { handleAuthenticatedRequest } from "@/lib/apiHelpers";
import { authenticatedRequest } from "@/lib/apiClient";

/**
 * GET /api/tasks - Get all tasks for the authenticated user
 */
export async function GET(request: NextRequest) {
  return handleAuthenticatedRequest(
    request,
    async (token) => {
      return authenticatedRequest("/api/tasks", token, {
        method: "GET",
      });
    },
    200
  );
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  return handleAuthenticatedRequest(
    request,
    async (token, req) => {
      const body = await req.json();
      return authenticatedRequest("/api/tasks", token, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    201
  );
}

