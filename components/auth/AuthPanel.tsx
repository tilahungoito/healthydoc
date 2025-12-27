'use client';

import { useState } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('sign-in');

  const tabs: { id: AuthMode; label: string }[] = [
    { id: 'sign-in', label: 'Sign in' },
    { id: 'sign-up', label: 'Create account' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Account access</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your secure profile'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'sign-in'
            ? 'Sync your recommendations, preferences, and history across every device.'
            : 'Establish a secure profile so we can personalize long-term insights for you.'}
        </p>
      </div>

      <div className="flex rounded-2xl bg-slate-100 p-1 text-sm font-semibold text-slate-500">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`w-1/2 rounded-xl px-4 py-2 transition ${
              mode === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'sign-in' ? <SignInForm /> : <SignUpForm />}

      <div className="relative text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        <span className="relative z-10 bg-white px-3">or</span>
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" />
      </div>

      <GoogleSignInButton />

      <p className="text-center text-xs text-slate-500">
        By continuing you agree to our privacy-first approach. No spam, no selling your data—ever.
      </p>
    </div>
  );
}


