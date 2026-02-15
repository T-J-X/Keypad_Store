import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    if (items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
            <ol className="flex items-center space-x-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={`${item.label}-${index}`} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight className="mx-2 h-4 w-4 text-ink-subtle" />
                            )}
                            {isLast ? (
                                <span className="font-medium text-ink" aria-current="page">
                                    {item.label}
                                </span>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="font-medium text-ink-muted transition-colors hover:text-ink"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="font-medium text-ink-muted">
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
