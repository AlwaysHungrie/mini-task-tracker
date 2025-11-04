import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts the Bearer token from the request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Returns an unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

/**
 * Returns an error response with appropriate status code
 */
export function errorResponse(
  error: unknown,
  defaultMessage: string,
  defaultStatus: number = 500
) {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  
  // Handle 404 errors
  if (errorMessage.toLowerCase().includes("not found")) {
    return NextResponse.json(
      { error: errorMessage },
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { error: errorMessage },
    { status: defaultStatus }
  );
}

/**
 * Wrapper for authenticated API routes
 */
export async function handleAuthenticatedRequest<T>(
  request: NextRequest,
  handler: (token: string, request: NextRequest) => Promise<T>,
  successStatus: number = 200,
  errorStatus: number = 500
) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return unauthorizedResponse();
    }

    const response = await handler(token, request);
    return NextResponse.json(response, { status: successStatus });
  } catch (error) {
    return errorResponse(error, "Request failed", errorStatus);
  }
}

/**
 * Wrapper for unauthenticated API routes
 */
export async function handleUnauthenticatedRequest<T>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<T>,
  successStatus: number = 200,
  errorStatus: number = 400
) {
  try {
    const response = await handler(request);
    return NextResponse.json(response, { status: successStatus });
  } catch (error) {
    return errorResponse(error, "Request failed", errorStatus);
  }
}


