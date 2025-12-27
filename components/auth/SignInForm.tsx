'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      // Provide more helpful error messages
      let errorMessage = 'Unable to sign in. Please try again.';
      
      if (signInError.message?.includes('Credential account not found') || 
          signInError.message?.includes('not found')) {
        errorMessage = 'No account found with this email. Please sign up first or use Google sign-in.';
      } else if (signInError.message?.includes('password') || 
                 signInError.message?.includes('invalid')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (signInError.message) {
        errorMessage = signInError.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }

    // Store "Keep me signed in" preference
    if (rememberMe) {
      document.cookie = `keep_signed_in=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; // 30 days
    } else {
      document.cookie = 'keep_signed_in=false; path=/; max-age=0; SameSite=Lax';
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring-4"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring-4"
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="rememberMe" className="text-sm text-slate-700">
          Keep me signed in
        </label>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in to continue'}
      </button>
    </form>
  );
}


