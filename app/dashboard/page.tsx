import DashboardShell from '@/components/dashboard/DashboardShell';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get('better-auth.session_token'));
  const hasOnboarded = cookieStore.get('onboarding_complete')?.value === 'true';

  if (!hasOnboarded && !hasSession) {
    redirect('/');
  }

  const guestMode = cookieStore.get('guest_mode')?.value === 'true';

  return <DashboardShell guestMode={guestMode} />;
}


