import type { Metadata } from 'next';
import { StitchHome } from '../components/stitch';

export const metadata: Metadata = {
  title: 'VCT | Premium Sim Racing Keypads',
  description: 'Choose a keypad model, map icon inserts, and export production-ready keypad configurations.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <StitchHome />;
}
