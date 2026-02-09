import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { resolveMetadataBase } from '../lib/siteUrl';

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: 'Keypad Store',
  description: 'Configure premium keypads with curated icon systems.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="page-shell">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
