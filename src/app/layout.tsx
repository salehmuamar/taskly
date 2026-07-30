import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/shared/ui/providers';
import { GlowBackground } from '@/shared/ui/glow-background';
import { I18nProvider } from '@/i18n';
import './globals.css';

// using Inter font for clean typography
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function sanitizeJsonLd(data: Record<string, unknown>): string {
  const sanitized = JSON.stringify(data);
  return sanitized
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taskly',
  description: 'Smart task management with prioritization, forecasting, and scheduling.',
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export const metadata: Metadata = {
  title: 'Taskly - Smart Task Management',
  description: 'Smart task management with AI-powered prioritization, forecasting, and scheduling.',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Taskly - Smart Task Management',
    description: 'Smart task management with AI-powered prioritization, forecasting, and scheduling.',
    type: 'website',
    siteName: 'Taskly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taskly - Smart Task Management',
    description: 'Smart task management with AI-powered prioritization, forecasting, and scheduling.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(jsonLd) }}
        />
      </head>
      <body className={inter.variable} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <Providers>
          <I18nProvider>
            <GlowBackground />
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
