import Link from 'next/link';
import AccessibleModal from '../../../ui/AccessibleModal';

type AuthPromptModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy: string;
  productName: string;
};

export default function AuthPromptModal({
  open,
  onClose,
  labelledBy,
  describedBy,
  productName,
}: AuthPromptModalProps) {
  return (
    <AccessibleModal
      open={open}
      onClose={onClose}
      labelledBy={labelledBy}
      describedBy={describedBy}
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      panelClassName="card w-full max-w-md space-y-4 p-6"
    >
      <h3 id={labelledBy} className="text-xl font-semibold tracking-tight text-ink">Sign in required</h3>
      <p id={describedBy} className="text-sm text-ink/65">
        Sign in to save <span className="font-semibold text-ink">{productName}</span> to your wishlist.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/login"
          className="group relative isolate inline-flex min-h-[44px] w-full min-w-[10rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold tracking-tight text-white whitespace-nowrap bg-neutral-950 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-inset ring-white/10 transition-[transform,box-shadow,background,ring-color] duration-200 hover:ring-sky-400/60 hover:shadow-[0_12px_36px_-18px_rgba(56,189,248,0.35)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="inline-flex min-h-[44px] w-full min-w-[10rem] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-neutral-950 whitespace-nowrap bg-white ring-1 ring-inset ring-neutral-200 transition-[transform,box-shadow,background] duration-200 hover:bg-neutral-50 hover:shadow-sm active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
        >
          Create account
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[44px] w-full min-w-[10rem] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-neutral-950 whitespace-nowrap bg-transparent ring-1 ring-inset ring-neutral-200 transition-[background,transform] duration-200 hover:bg-neutral-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
        >
          Not now
        </button>
      </div>
    </AccessibleModal>
  );
}
