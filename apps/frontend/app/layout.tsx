import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Navbar from '../components/Navbar';
import AnimatedFooterLayout from '../components/AnimatedFooterLayout';
import SiteJsonLd from '../components/SiteJsonLd';
import ClientRuntimeGate from '../components/layout/ClientRuntimeGate';
import { TooltipProvider } from '../components/ui/tooltip';
import { resolveMetadataBase } from '../lib/siteUrl';

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  applicationName: 'Vehicle Control Technologies',
  title: {
    default: 'VCT | Vehicle Control Technologies',
    template: '%s | VCT',
  },
  description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
  keywords: [
    'vehicle control technologies',
    'VCT',
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
    title: 'VCT | Vehicle Control Technologies',
    description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
    url: '/',
    siteName: 'Vehicle Control Technologies',
    type: 'website',
    images: [
      {
        url: '/vct-logo.png',
        width: 1200,
        height: 630,
        alt: 'Vehicle Control Technologies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VCT | Vehicle Control Technologies',
    description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
    images: ['/vct-logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased bg-transparent">
        <TooltipProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg"
          >
            Skip to main content
          </a>
          <SiteJsonLd />
          <AnimatedFooterLayout>
            <Suspense fallback={<div className="h-16 w-full border-b border-white/10" />}>
              <Navbar />
            </Suspense>
            <div id="main-content" className="flex-1 pt-24 lg:pt-28 pb-12 lg:pb-20">{children}</div>
          </AnimatedFooterLayout>
          <Suspense fallback={null}>
            <ClientRuntimeGate />
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
