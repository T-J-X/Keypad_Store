import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalToastViewport from '../components/GlobalToastViewport';
import SiteJsonLd from '../components/SiteJsonLd';
import CookieBanner from '../components/CookieBanner';
import { resolveMetadataBase } from '../lib/siteUrl';

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: 'Keypad Store | Configure Technical Keypads',
    template: '%s | Keypad Store',
  },
  description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
  keywords: [
    'keypad configurator',
    'custom keypad',
    'marine keypad icons',
    'CAN keypad',
    'engineering specification',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Keypad Store | Configure Technical Keypads',
    description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
    url: '/',
    siteName: 'Keypad Store',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keypad Store | Configure Technical Keypads',
    description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg"
        >
          Skip to main content
        </a>
        <SiteJsonLd />
        <div className="page-shell">
          <Suspense fallback={<div className="h-16 w-full border-b border-white/10" />}>
            <Navbar />
          </Suspense>
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <GlobalToastViewport />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}
