"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export function Navbar({
  userName,
  onLogout,
  isAuthenticated,
}: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="notion-page px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="text-[15px] font-semibold text-foreground">
            Task Tracker
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {userName || "User"}
                </span>
                <button
                  onClick={onLogout}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
                >
                  Sign in
                </button>
                <button
                  onClick={() => router.push("/auth")}
                  className="text-sm bg-foreground text-background hover:bg-foreground/90 px-3 py-1.5 rounded transition-colors"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

