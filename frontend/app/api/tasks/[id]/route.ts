import { NextRequest } from "next/server";
import { handleAuthenticatedRequest } from "@/lib/apiHelpers";
import { authenticatedRequest } from "@/lib/apiClient";

/**
 * PUT /api/tasks/[id] - Update a task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthenticatedRequest(
    request,
    async (token, req) => {
      const { id } = await params;
      const body = await req.json();
      return authenticatedRequest(`/api/tasks/${id}`, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    200,
    400
  );
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthenticatedRequest(
    request,
    async (token, req) => {
      const { id } = await params;
      return authenticatedRequest(`/api/tasks/${id}`, token, {
        method: "DELETE",
      });
    },
    200
  );
}

