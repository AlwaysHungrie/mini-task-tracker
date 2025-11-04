'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SignupFormProps {
  onSuccess?: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded px-3 py-2 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-normal text-foreground">
          Name
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
          className="text-[15px]"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-normal text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="text-[15px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-normal text-foreground">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Min. 6 characters"
          className="text-[15px]"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full text-sm bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
