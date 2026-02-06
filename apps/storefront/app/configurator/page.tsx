import Link from 'next/link';
import KeypadCard from '../../components/KeypadCard';
import { fetchKeypadProducts } from '../../lib/vendure.server';

export default async function ConfiguratorPage() {
  const keypads = await fetchKeypadProducts();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="pill">Configurator</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Choose your keypad model
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/60">
            Select a base keypad to start building. You will be able to place icons, adjust layouts, and save variations
            in the next step.
          </p>
        </div>
        <Link href="/shop" className="btn-ghost">Browse icon catalog</Link>
      </div>

      {keypads.length === 0 ? (
        <div className="card-soft p-8 text-sm text-ink/60">No keypad models available yet.</div>
      ) : (
        <div className="staggered grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keypads.map((keypad) => (
            <KeypadCard key={keypad.id} product={keypad} />
          ))}
        </div>
      )}
    </div>
  );
}
