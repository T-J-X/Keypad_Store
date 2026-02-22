import Link from 'next/link';
import type { RefObject } from 'react';
import { UserRound } from 'lucide-react';

export default function NavPill({
  href,
  label,
  icon: Icon,
  onClick,
  inverse = false,
  badge,
  buttonRef,
  as = 'link',
  active = false,
  showLabel = false,
  expandOnHover = true,
  prefetch,
}: {
  href?: string;
  label: string;
  icon?: typeof UserRound;
  onClick?: () => void;
  inverse?: boolean;
  badge?: number;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  as?: 'link' | 'button';
  active?: boolean;
  showLabel?: boolean;
  expandOnHover?: boolean;
  prefetch?: boolean;
}) {
  const navModeClass = inverse ? 'nav-pill-sticky' : 'nav-pill-default';
  const navStateClass = active ? (inverse ? 'nav-pill-sticky-active' : 'nav-pill-active') : '';

  const baseClasses = [
    'group nav-pill',
    navModeClass,
    navStateClass,
    showLabel ? 'nav-pill-expanded' : '',
  ].join(' ');

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} /> : null}
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#071835] text-[10px] font-bold text-white shadow-sm ring-2 ring-[#020916]">
            {badge}
          </span>
        ) : null}
      </div>

      {showLabel ? (
        <span className="text-sm font-medium">{label}</span>
      ) : (
        <div className={`max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-300 ${expandOnHover ? 'group-hover:max-w-[120px] group-hover:opacity-100' : ''}`}>
          <span className="pr-4 text-sm font-medium">{label}</span>
        </div>
      )}
    </>
  );

  if (as === 'button') {
    return (
      <button ref={buttonRef} type="button" onClick={onClick} className={baseClasses} aria-label={label}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || '#'} prefetch={prefetch} onClick={onClick} className={baseClasses}>
      {content}
    </Link>
  );
}
