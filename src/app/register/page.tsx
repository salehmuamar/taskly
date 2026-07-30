'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { CheckCircle, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useI18n } from '@/i18n';

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError(t('auth.passwordsDontMatch')); return; }
    if (formData.password.length < 8) { setError(t('auth.passwordTooShort')); return; }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || t('auth.registrationFailed')); return; }
      router.push('/login?registered=true');
    } catch { setError(t('auth.errorOccurred')); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen relative" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 end-4 z-50 flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl p-2.5 text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </button>
        )}
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="rounded-xl p-2.5 text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
          aria-label={t('auth.switchLang')}
        >
          <Globe className="h-4 w-4" />
        </button>
      </div>

      {/* Left hero panel */}
      <div className="hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 dark:from-indigo-600/20 via-violet-600/10 to-transparent" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[120px] animate-[aurora-drift_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 dark:bg-violet-500/20 rounded-full blur-[100px] animate-[aurora-drift-reverse_22s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 dark:bg-cyan-500/15 rounded-full blur-[80px] animate-[aurora-drift-slow_25s_ease-in-out_infinite]" />

        <div className="relative text-center z-10">
          <div className="mx-auto h-24 w-24 rounded-3xl glass-strong flex items-center justify-center shadow-2xl shadow-indigo-500/15 dark:shadow-indigo-500/20 mb-8 animate-fade-in-up">
            <CheckCircle className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-800 via-indigo-600 to-violet-600 dark:from-white dark:via-indigo-200 dark:to-violet-200 bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Taskly
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t('auth.startManaging')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-slate-400 dark:text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" /> {t('auth.freeToStart')}</div>
            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" /> {t('auth.noCreditCard')}</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl glass-strong flex items-center justify-center lg:hidden mb-4 shadow-lg shadow-indigo-500/15 dark:shadow-indigo-500/20">
              <CheckCircle className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('auth.createAccount')}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('auth.getStarted')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-2xl glass border-red-500/20 p-4 text-sm text-red-500 dark:text-red-400 flex items-center gap-2 animate-scale-in">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input label={t('auth.fullName')} type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label={t('auth.email')} type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label={t('auth.password')} type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <Input label={t('auth.confirmPassword')} type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
            </div>

            <Button type="submit" className="w-full h-12" isLoading={isLoading}>{t('auth.createAccount')}</Button>
          </form>

          <p className="text-center text-sm text-slate-400 dark:text-slate-400">
            {t('auth.hasAccount')} <Link href="/login" className="font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
