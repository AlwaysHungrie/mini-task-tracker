'use server';

import { redirect } from 'next/navigation';
import { AuthResponse, LoginRequest } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LoginActionState {
  error?: string;
  success?: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

export async function loginAction(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return {
      error: 'Email and password are required',
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      return {
        error: error.error || `Login failed: ${response.statusText}`,
      };
    }

    const data: AuthResponse = await response.json();

    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

