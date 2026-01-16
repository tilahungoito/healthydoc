'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ONBOARDING_COOKIE = 'onboarding_complete';
const GUEST_COOKIE = 'guest_mode';

export async function requestFullAccess() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
  cookieStore.delete(ONBOARDING_COOKIE);
  redirect('/?auth=1');
}


