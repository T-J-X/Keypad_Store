import { type ProductDownload } from './productFieldData';

export default function DownloadsList({
  downloads,
}: {
  downloads: ProductDownload[];
}) {
  if (downloads.length === 0) {
    return <p className="text-base leading-7 text-ink/60">Downloads coming soon.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {downloads.map((download) => {
        const extension = fileExtension(download.href);
        return (
          <li key={download.id}>
            <a
              href={download.href}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl border border-ink/12 bg-white p-4 shadow-[0_1px_3px_rgba(4,15,46,0.08)] transition hover:-translate-y-[1px] hover:border-ink/25 hover:shadow-[0_10px_24px_rgba(4,15,46,0.14)]"
            >
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(165deg,#0E2A5A_0%,#1F4A8D_100%)] text-xs font-bold uppercase tracking-[0.08em] text-white">
                  {extension || 'file'}
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-semibold text-ink">{download.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.08em] text-ink/50">
                    {download.source === 'customField' ? 'Product file' : 'Asset'}
                  </div>
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function fileExtension(href: string) {
  const clean = href.split('?')[0] ?? href;
  const segment = clean.split('/').pop() ?? '';
  const match = segment.match(/\.([a-z0-9]+)$/i);
  if (!match) return '';
  return match[1].toLowerCase().slice(0, 4);
}
