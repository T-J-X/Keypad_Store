import Link from 'next/link';
import ShopCategoryIcon from './ShopCategoryIcon';

type BaseProps = {
  label: string;
  count?: number;
  image?: string | null;
  subtitle?: string;
  className?: string;
};

type ClickProps = BaseProps & {
  onClick: () => void;
  href?: never;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: never;
};

type StaticProps = BaseProps & {
  href?: never;
  onClick?: never;
};

type CategoryCardProps = ClickProps | LinkProps | StaticProps;

const shellClass =
  'group h-full w-full rounded-2xl border border-surface-border bg-[linear-gradient(160deg,#ffffff_0%,#f9fbff_100%)] p-4 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-premium';

export default function CategoryCard(props: CategoryCardProps) {
  const content = (
    <div className={`flex min-h-[108px] items-center justify-between gap-4 ${props.className ?? ''}`}>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold tracking-tightest text-ink">{props.label}</div>
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
          {props.subtitle ?? (typeof props.count === 'number' ? `${props.count} inserts` : 'Explore inserts')}
        </div>
      </div>
      <div className="shrink-0">
        <ShopCategoryIcon image={props.image} alt={props.label} />
      </div>
    </div>
  );

  if ('onClick' in props && typeof props.onClick === 'function') {
    return (
      <button type="button" onClick={props.onClick} className={shellClass}>
        {content}
      </button>
    );
  }

  if ('href' in props && typeof props.href === 'string') {
    return (
      <Link href={props.href} className={shellClass}>
        {content}
      </Link>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
