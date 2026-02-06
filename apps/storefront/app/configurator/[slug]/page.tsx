import Link from 'next/link';

export default function ConfiguratorPlaceholder() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center">
      <div className="pill">Configurator</div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        Configurator coming soon
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/60">
        We are finishing the interactive configurator experience. You will be able to place icon inserts, preview
        overlays, and save layouts right here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link href="/configurator" className="btn-ghost">Back to models</Link>
        <Link href="/shop" className="btn-primary">Browse icons</Link>
      </div>
    </div>
  );
}
