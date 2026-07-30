export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Sidebar } from '@/shared/ui/sidebar';
import { ErrorBoundary } from '@/shared/ui/error-boundary';

export const metadata: Metadata = {
  title: 'Taskly - Dashboard',
  description: 'Overview of your projects, tasks, and analytics.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:glass-strong focus:p-4 focus:rounded-2xl focus:border focus:border-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/20">
        Skip to content
      </a>
      <Sidebar />
      <main id="main-content" className="pt-16 lg:ml-64 lg:pt-8 p-4 lg:p-8 min-h-screen dark:bg-[rgba(255,255,255,0.002)]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
