import { NextRequest } from "next/server";
import { handleUnauthenticatedRequest } from "@/lib/apiHelpers";
import { apiRequest } from "@/lib/apiClient";

export async function POST(request: NextRequest) {
  return handleUnauthenticatedRequest(
    request,
    async (req) => {
      const body = await req.json();
      return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    200,
    401
  );
}

