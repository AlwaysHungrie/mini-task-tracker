"use client";

import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isAuthenticated, logout, isLoading } = useUser();

  if (isLoading) {
    return (
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="text-lg font-medium text-neutral-900">
              Mini Task Tracker
            </Link>
            <div className="h-8 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
          >
            Mini Task Tracker
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                onClick={logout}
                className="text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              >
                Logout
              </Button>
            ) : (
              <>
                <Link href="/auth?mode=login">
                  <Button
                    variant="ghost"
                    className="text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth?mode=register">
                  <Button className="text-sm bg-neutral-900 text-white hover:bg-neutral-800">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
