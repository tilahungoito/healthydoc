'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { requestFullAccess } from '@/lib/actions/guest';
import { ChevronDown, ChevronUp, LogIn, LogOut, ShieldAlert, Sparkles, UserRound } from 'lucide-react';

interface ProfileMenuProps {
  guestMode?: boolean;
}

export default function ProfileMenu({ guestMode = false }: ProfileMenuProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageError, setImageError] = useState(false);

  const user = session?.user;
  const isGuest = guestMode || !user;

  const displayName = isGuest ? 'Guest Explorer' : user?.name || user?.email || 'Healthy Human';
  const displaySubline = isGuest ? 'History disabled • No tracking' : user?.email || 'Synced profile';
  const userImage = user?.image;

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.id, userImage]);

  const handleRequestFullAccess = () => {
    startTransition(async () => {
      await requestFullAccess();
    });
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await authClient.signOut();
    router.push('/');
    router.refresh();
    setIsMenuOpen(false);
    setIsSigningOut(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300"
      >
        <div className="flex items-center gap-3">
          {userImage && !imageError ? (
            <img
              src={userImage}
              alt={displayName}
              className="h-10 w-10 rounded-xl object-cover border-2 border-gray-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                isGuest ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}
            >
              <UserRound className="h-5 w-5" />
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{displaySubline}</p>
          </div>
        </div>
        {isMenuOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {isMenuOpen && (
        <div className="absolute left-0 right-0 z-20 mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-2xl">
          {isGuest ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-amber-900">
                <ShieldAlert className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Exploring in Guest Mode</p>
                  <p className="text-xs text-amber-800">
                    Analyses run locally and vanish after this session. Sign up to unlock history, personal insights, and
                    synced settings.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRequestFullAccess}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogIn className="h-4 w-4" />
                {isPending ? 'Opening sign-in…' : 'Sign up / Log in'}
              </button>
              <p className="text-center text-xs text-gray-500">
                We will reset guest mode and bring you back to the welcome screen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3 text-indigo-900">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Synced Profile Active</p>
                  <p className="text-xs text-indigo-800">Personalized recommendations and history are enabled.</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Email</p>
                <p className="text-sm text-gray-700">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


