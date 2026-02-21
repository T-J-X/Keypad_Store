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
            <div className="max-h-[320px] space-y-2 overflow-y-auto px-1 py-1 custom-scrollbar">
                {lines.map((line) => {
                    const product = line.productVariant?.product;
                    const imagePath = product?.featuredAsset?.preview || product?.featuredAsset?.source;
                    const imageUrl = imagePath ? assetUrl(imagePath) : null;

                    return (
                        <Link
                            key={line.id}
                            href={product?.slug ? `/shop/product/${product.slug}` : '#'}
                            onClick={onClose}
                            className="group flex gap-3 rounded-xl border border-white/60 bg-white/85 p-3 backdrop-blur-sm shadow-[0_10px_24px_rgba(7,21,44,0.16)] transition-[transform,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-white/92 hover:shadow-[0_14px_28px_rgba(7,21,44,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
                        >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
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
                                <div className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                                    {product?.name || line.productVariant?.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Qty: {line.quantity} × {formatPrice(line.linePriceWithTax / line.quantity, currencyCode)}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center text-right">
                                <div className="text-sm font-semibold text-slate-900">
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
                    prefetch={false}
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Checkout
                </Link>
                <Link
                    href="/cart"
                    prefetch={false}
                    onClick={onClose}
                    className="mt-2 flex w-full items-center justify-center rounded-xl border border-[#5f8fd1] bg-[#1e4f95] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(20,61,120,0.35)] transition-colors hover:border-[#7fb1f4] hover:bg-[#2a65bc]"
                >
                    View Cart
                </Link>
            </div>
        </div>
    );
}
