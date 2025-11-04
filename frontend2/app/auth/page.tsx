'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-background p-8 border border-border">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center text-sm font-normal transition-colors ${
                activeTab === 'login'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-center text-sm font-normal transition-colors ${
                activeTab === 'signup'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Forms */}
          {activeTab === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}
