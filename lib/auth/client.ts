'use client';

import { createAuthClient } from 'better-auth/react';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return new URL('/api/auth', window.location.origin).toString();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return new URL('/api/auth', appUrl).toString();
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});


