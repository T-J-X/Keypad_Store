'use client';

import Image from 'next/image';
import Link from 'next/link';
import { assetUrl } from '../lib/vendure';

type MiniCartLine = {
    id: string;
    quantity: number;
    linePriceWithTax: number;
    productVariant: {
        name?: string;
        product?: {
            name?: string;
            slug?: string;
            featuredAsset?: {
                preview: string | null;
                source: string | null;
            } | null;
        } | null;
    } | null;
};

type MiniCartProps = {
    lines: MiniCartLine[];
    currencyCode: string;
    totalWithTax: number;
    onClose: () => void;
};

function formatPrice(value: number, currency: string) {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(value / 100);
    } catch {
        return `${(value / 100).toFixed(2)} ${currency}`;
    }
}

export default function MiniCart({ lines, currencyCode, totalWithTax, onClose }: MiniCartProps) {
    if (lines.length === 0) {
        return (
            <div className="flex h-32 flex-col items-center justify-center p-6 text-center text-sm text-white/50">
                <p>Your cart is empty.</p>
                <Link
                    href="/shop"
                    onClick={onClose}
                    className="mt-2 text-blue-400 hover:text-blue-300"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="max-h-[320px] overflow-y-auto px-1 py-1 custom-scrollbar">
                {lines.map((line) => {
                    const product = line.productVariant?.product;
                    const imagePath = product?.featuredAsset?.preview || product?.featuredAsset?.source;
                    const imageUrl = imagePath ? assetUrl(imagePath) : null;

                    return (
                        <Link
                            key={line.id}
                            href={product?.slug ? `/shop/product/${product.slug}` : '#'}
                            onClick={onClose}
                            className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                        >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={product?.name || 'Product'}
                                        fill
                                        className="object-contain p-1"
                                        sizes="48px"
                                    />
                                ) : null}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                <div className="truncate text-sm font-medium text-white group-hover:text-blue-200">
                                    {product?.name || line.productVariant?.name}
                                </div>
                                <div className="text-xs text-white/50">
                                    Qty: {line.quantity} × {formatPrice(line.linePriceWithTax / line.quantity, currencyCode)}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center text-right">
                                <div className="text-sm font-medium text-white">
                                    {formatPrice(line.linePriceWithTax, currencyCode)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-2 border-t border-white/10 pt-4">
                <div className="mb-4 flex items-center justify-between px-2 text-sm font-medium">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white">{formatPrice(totalWithTax, currencyCode)}</span>
                </div>
                <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Checkout
                </Link>
                <Link
                    href="/cart"
                    onClick={onClose}
                    className="mt-2 flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white/60 hover:text-white"
                >
                    View Cart
                </Link>
            </div>
        </div>
    );
}
