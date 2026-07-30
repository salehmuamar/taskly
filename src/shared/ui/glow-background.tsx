'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function GlowBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration gate pattern
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950'
          : 'bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100'
      }`} />

      {/* Aurora layers — dark */}
      <div className={`aurora-layer aurora-blue ${!isDark ? 'light-aurora' : ''}`} />
      <div className={`aurora-layer aurora-purple ${!isDark ? 'light-aurora' : ''}`} />
      <div className={`aurora-layer aurora-pink ${!isDark ? 'light-aurora' : ''}`} />
      <div className={`aurora-layer aurora-blue-2 ${!isDark ? 'light-aurora' : ''}`} />

      {/* Vignette overlay */}
      <div className={`absolute inset-0 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.3)_70%,rgba(15,23,42,0.7)_100%)]'
          : 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(241,245,249,0.2)_70%,rgba(241,245,249,0.5)_100%)]'
      }`} />
    </div>
  );
}
