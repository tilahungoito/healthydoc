import AuthPanel from '@/components/auth/AuthPanel';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const continueAsGuest = async () => {
  'use server';

  const cookieStore = await cookies();
  cookieStore.set('onboarding_complete', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
  cookieStore.set('guest_mode', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  });

  redirect('/dashboard');
};

interface WelcomePageProps {
  searchParams?: {
    auth?: string;
  };
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get('better-auth.session_token'));
  const hasOnboarded = cookieStore.get('onboarding_complete')?.value === 'true';
  const keepSignedIn = cookieStore.get('keep_signed_in')?.value === 'true';
  const forceAuth = searchParams?.auth === '1';

  // Only redirect if user has session/onboarded AND wants to keep signed in
  if (!forceAuth && (hasSession || hasOnboarded) && keepSignedIn) {
    redirect('/dashboard');
  }

  const highlights = [
    'Secure health insights backed by Better Auth',
    'Cross-device history & personalized recommendations',
    'Voice-first intake assist + advanced malaria detection',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 space-y-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">AI Health Assistant</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              Your smarter path to proactive care.
            </h1>
            <p className="mt-6 text-base text-slate-300 sm:text-lg">
              Connect with our models for differential symptom checks, malaria screening, personalized lifestyle nudges,
              and rapid facility lookups—backed by enterprise-grade Better Auth security.
            </p>
          </div>

          <ul className="space-y-4">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 backdrop-blur"
              >
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-6 py-4 text-sm text-indigo-100">
            <p className="font-semibold text-indigo-200">Guest experience</p>
            <p className="mt-1 text-indigo-100/90">
              You can continue without creating an account. We will keep analyses on-device only, and you will not see
              history, saved settings, or longitudinal recommendations until you sign up.
            </p>
          </div>
        </section>

        <section className="mt-16 flex-1 rounded-3xl border border-white/10 bg-white px-8 py-10 text-slate-900 shadow-2xl lg:mt-0">
          <AuthPanel />

          <div className="mt-8 space-y-2">
            <div className="relative text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="relative z-10 bg-white px-3">or</span>
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" />
            </div>
            <form action={continueAsGuest} className="space-y-2">
              <input type="hidden" name="mode" value="guest" />
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Continue without an account
              </button>
              <p className="text-center text-xs text-slate-500">
                We will not retain your inputs or personalize recommendations in guest mode.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}


