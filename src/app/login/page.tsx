'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { CheckCircle, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError(t('auth.invalidCredentials')); } else { router.push('/dashboard'); }
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
            {t('auth.smartManagement')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-slate-400 dark:text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" /> {t('auth.realTimeCollab')}</div>
            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" /> {t('auth.smartAnalytics')}</div>
            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" /> {t('auth.dragDrop')}</div>
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
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('auth.welcomeBack')}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('auth.signInToContinue')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-2xl glass border-red-500/20 p-4 text-sm text-red-500 dark:text-red-400 flex items-center gap-2 animate-scale-in">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input label={t('auth.email')} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label={t('auth.password')} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full h-12" isLoading={isLoading}>{t('auth.login')}</Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5 dark:border-white/5" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-slate-400 dark:text-slate-400">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <Button type="button" variant="secondary" className="w-full h-12" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
              <svg className="me-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('auth.login')} {t('auth.google')}
            </Button>

            <Button type="button" variant="secondary" className="w-full h-12" onClick={() => signIn('github', { callbackUrl: '/dashboard' })}>
              <svg className="me-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {t('auth.login')} {t('auth.github')}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 dark:text-slate-400">
            {t('auth.noAccount')} <Link href="/register" className="font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
