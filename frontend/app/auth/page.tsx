"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useUser();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Set initial tab based on URL query parameter
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register" || mode === "signup") {
      setActiveTab("signup");
    } else if (mode === "login") {
      setActiveTab("login");
    }
  }, [searchParams]);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "login" | "signup") => {
    setActiveTab(tab);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-background p-8">
          {/* Tabs */}
          <div className="mb-8 flex gap-1 border-b border-border">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-2 text-center text-sm font-normal transition-colors ${
                activeTab === "login"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={loading}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`flex-1 py-2 text-center text-sm font-normal transition-colors ${
                activeTab === "signup"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={loading}
            >
              Sign up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-normal text-foreground">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="text-[15px]"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-normal text-foreground">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="text-[15px]"
                  disabled={loading}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-sm font-normal text-foreground">
                  Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="text-[15px]"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-normal text-foreground">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="text-[15px]"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-normal text-foreground">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="text-[15px]"
                  disabled={loading}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

