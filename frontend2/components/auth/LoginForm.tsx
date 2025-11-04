'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loginAction, type LoginActionState } from '@/lib/actions/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const { syncAuth } = useAuth();
  const [state, formAction, isPending] = useActionState<LoginActionState | null, FormData>(
    loginAction,
    null
  );

  // Handle successful login
  useEffect(() => {
    if (state?.success && state.token && state.user) {
      // Sync auth state with AuthContext
      syncAuth(state.token, state.user);
      
      // Trigger callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to home page
        router.push('/');
      }
    }
  }, [state, onSuccess, router, syncAuth]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded px-3 py-2 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-normal text-foreground">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="text-[15px]"
          autoFocus
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-normal text-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Enter your password"
          className="text-[15px]"
          disabled={isPending}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full text-sm bg-foreground text-background hover:bg-foreground/90"
        >
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
}
