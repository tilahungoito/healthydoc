'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import GoogleIcon from './GoogleIcon';

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setError(null);
    setIsLoading(true);

    try {
      // Check if "keep me signed in" checkbox exists in the form (we'll add it)
      // For now, we'll default to true for Google sign-in (they usually want persistent sessions)
      document.cookie = `keep_signed_in=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; // 30 days
      
      const callbackURL =
        typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard';
      
      const { error: socialError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });

      if (socialError) {
        // Handle specific error cases
        if (socialError.message?.includes('not configured') || socialError.message?.includes('not enabled')) {
          setError('Google sign-in is not configured. Please contact support.');
        } else {
          setError(socialError.message || 'Unable to start Google sign-in. Please try again.');
        }
        setIsLoading(false);
        return;
      }
      
      // If successful, Better Auth will handle the redirect automatically
      // No need to manually redirect or set loading to false
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm"
      >
        <GoogleIcon className="h-5 w-5" />
        {isLoading ? 'Connecting to Google…' : 'Continue with Google'}
      </button>

      {error && (
        <p className="text-center text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
}


