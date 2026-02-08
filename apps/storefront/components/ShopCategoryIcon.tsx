import { assetUrl } from '../lib/vendure';

export default function ShopCategoryIcon({
  image,
  alt,
}: {
  image?: string | null;
  alt: string;
}) {
  const src = image ? assetUrl(image) : '';

  return (
    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-[#1a3f77]/20 bg-[linear-gradient(150deg,#f4f8ff_0%,#ffffff_42%,#ecf3ff_100%)] shadow-[inset_0_0_0_1px_rgba(63,117,196,0.1),0_8px_18px_rgba(9,28,61,0.12)]">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain p-2"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2.5">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full text-[#2f5ca1]">
            <path
              d="M5 7.5h14M5 12h14M5 16.5h14M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
