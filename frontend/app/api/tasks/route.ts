import { NextRequest } from "next/server";
import { handleAuthenticatedRequest } from "@/lib/apiHelpers";
import { authenticatedRequest } from "@/lib/apiClient";

/**
 * GET /api/tasks - Get all tasks for the authenticated user
 * Supports query params: status, dueDate
 */
export async function GET(request: NextRequest) {
  return handleAuthenticatedRequest(
    request,
    async (token) => {
      // Extract query params
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status");
      const dueDate = searchParams.get("dueDate");

      // Build query string
      const queryParams = new URLSearchParams();
      if (status) queryParams.set("status", status);
      if (dueDate) queryParams.set("dueDate", dueDate);

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `/api/tasks?${queryString}`
        : "/api/tasks";

      return authenticatedRequest(endpoint, token, {
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

