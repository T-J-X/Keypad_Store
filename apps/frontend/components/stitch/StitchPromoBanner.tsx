import Link from 'next/link';

export interface StitchPromoBannerProps {
  readonly title: string;
  readonly body: string;
  readonly href: string;
}

export default function StitchPromoBanner({ title, body, href }: Readonly<StitchPromoBannerProps>) {
  return (
    <section className="mb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--stitch-primary)] to-indigo-900 px-6 py-10 text-center">
        <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/85">{body}</p>
        <Link
          href={href}
          className="mt-6 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-[var(--stitch-primary)] transition hover:scale-[1.02]"
        >
          Start Configurator
        </Link>
      </div>
    </section>
  );
}
