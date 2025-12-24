'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (cancelled) return;
        router.replace(response.ok ? '/dashboard' : '/login');
      } catch {
        if (cancelled) return;
        router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6">
      <div className="text-center">
        <div className="group inline-flex flex-col items-center gap-5 select-none">
          <div className="relative">
            {/* Glow halo */}
            <div className="absolute inset-0 blur-2xl opacity-35 transition-opacity duration-500 group-hover:opacity-70 bg-gradient-to-r from-primary-500/40 via-blue-500/30 to-cyan-400/30 rounded-full" />

            {/* Logo */}
            <div className="relative">
              <Image
                src="/streakd_logo.png"
                alt="STREAKD. logo"
                width={160}
                height={160}
                unoptimized
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border border-gray-700/70 bg-gray-900/40 shadow-xl transition-all duration-500 ease-out
                  group-hover:scale-[1.06] group-hover:-rotate-2 group-hover:shadow-2xl
                  group-hover:border-primary-500/50
                  group-hover:animate-[streakdWobble_900ms_ease-in-out]"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5 group-hover:ring-primary-400/25 transition-all duration-500" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Image
              src="/title.png"
              alt="STREAKD."
              width={420}
              height={80}
              unoptimized
              className="h-10 w-auto opacity-95 drop-shadow-[0_0_18px_rgba(59,130,246,0.15)]"
            />
            <div className="text-sm text-gray-400">
              Checking session…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

