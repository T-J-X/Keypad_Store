import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalToastViewport from '../components/GlobalToastViewport';
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
        <div className="page-shell">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <GlobalToastViewport />
        </div>
      </body>
    </html>
  );
}
