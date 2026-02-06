'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState('');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setValue(q);
  }, [searchParams]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = value.trim();
    if (!next) {
      router.push('/shop');
      return;
    }
    if (pathname?.startsWith('/shop')) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', next);
      router.replace(`/shop?${params.toString()}`);
      return;
    }
    router.push(`/shop?q=${encodeURIComponent(next)}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-[360px]">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search button inserts, IDs, or categories"
        className="input pr-20"
        aria-label="Search button inserts"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
      >
        Search
      </button>
    </form>
  );
}
