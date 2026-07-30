'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/i18n';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CheckCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Calendar,
  Layers,
  Globe,
} from 'lucide-react';
import { NotificationBell } from '@/shared/ui/notification-bell';

const navItems = [
  { key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.projects', href: '/projects', icon: FolderKanban },
  { key: 'nav.workspaces', href: '/workspaces', icon: Layers },
  { key: 'nav.myTasks', href: '/tasks', icon: CheckSquare },
  { key: 'nav.calendar', href: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted state only set once on client
  useEffect(() => setMounted(true), []);

  const closeSidebar = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeSidebar(); return; }
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const closeBtn = sidebarRef.current?.querySelector<HTMLElement>('[aria-label="Close menu"]');
      closeBtn?.focus();
    });

    return () => { document.removeEventListener('keydown', handleKeyDown); previousFocusRef.current?.focus(); };
  }, [isOpen, closeSidebar]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-2xl glass-strong p-2 shadow-lg shadow-black/10 dark:shadow-black/20 lg:hidden"
        aria-label={t('nav.openMenu')}
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        ref={sidebarRef}
        aria-label={t('nav.mainNav')}
        className={`fixed left-0 top-0 z-40 h-screen w-64 glass-strong border-r border-black/5 dark:border-white/5 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-black/5 dark:border-white/5 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" onClick={closeSidebar}>
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 shadow-lg shadow-indigo-500/30">
              <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 dark:from-indigo-400 to-violet-500 dark:to-violet-400 bg-clip-text text-transparent">Taskly</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={closeSidebar} className="rounded-xl p-1 text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white lg:hidden" aria-label={t('nav.closeMenu')}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-4" aria-label={t('nav.sidebarNav')}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/15 dark:to-violet-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-300'}`} aria-hidden="true" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-black/5 dark:border-white/5 p-3 space-y-1">
          <div className="flex gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
              aria-label={mounted ? (theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')) : t('nav.theme')}
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" /> : <Moon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span className="text-xs">{mounted ? (theme === 'dark' ? t('nav.light') : t('nav.dark')) : t('nav.theme')}</span>
            </button>
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
              aria-label={t('auth.switchLang')}
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs">{locale === 'en' ? 'عربي' : 'EN'}</span>
            </button>
          </div>
          <Link href="/settings" onClick={closeSidebar} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all duration-200">
            <Settings className="h-5 w-5 text-slate-400 dark:text-slate-300" aria-hidden="true" />
            {t('nav.settings')}
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200">
            <LogOut className="h-5 w-5 text-slate-400 dark:text-slate-300" aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
