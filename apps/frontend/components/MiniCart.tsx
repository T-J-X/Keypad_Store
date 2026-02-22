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
            minimumFractionDigits: 2,
        }).format(value / 100);
    } catch {
        return `${(value / 100).toFixed(2)} ${currency}`;
    }
}

export default function MiniCart({ lines, currencyCode, totalWithTax, onClose }: MiniCartProps) {
    if (lines.length === 0) {
        return (
            <div className="flex h-32 flex-col items-center justify-center p-6 text-center text-sm text-white/50 animate-fade-up">
                <p className="font-sans">Your cart is empty.</p>
                <Link
                    href="/shop"
                    onClick={onClose}
                    className="mt-3 text-sky font-semibold hover:text-sky-400 transition-colors"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col animate-scale-in origin-top-right">
            <div className="max-h-[380px] space-y-3 overflow-y-auto px-2 py-2 custom-scrollbar">
                {lines.map((line) => {
                    const product = line.productVariant?.product;
                    const imagePath = product?.featuredAsset?.preview || product?.featuredAsset?.source;
                    const imageUrl = imagePath ? assetUrl(imagePath) : null;

                    return (
                        <Link
                            key={line.id}
                            href={product?.slug ? `/shop/product/${product.slug}` : '#'}
                            onClick={onClose}
                            className="group flex gap-4 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-[2px] hover:border-white/15 hover:bg-white/10 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
                        >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-inner">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={product?.name || 'Product'}
                                        fill
                                        className="object-contain p-2"
                                        sizes="56px"
                                    />
                                ) : null}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                <div className="truncate text-sm font-semibold text-white transition-colors group-hover:text-sky">
                                    {product?.name || line.productVariant?.name}
                                </div>
                                <div className="mt-0.5 text-[13px] font-mono text-white/50">
                                    Qty: {line.quantity} × {formatPrice(line.linePriceWithTax / line.quantity, currencyCode)}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center text-right">
                                <div className="text-[15px] font-mono font-bold text-white">
                                    {formatPrice(line.linePriceWithTax, currencyCode)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-2 border-t border-white/10 pt-4 px-2 pb-2">
                <div className="mb-5 flex items-center justify-between text-[15px]">
                    <span className="font-sans font-medium text-white/60">Subtotal</span>
                    <span className="font-mono font-bold text-white">{formatPrice(totalWithTax, currencyCode)}</span>
                </div>
                <div className="space-y-3">
                    <Link
                        href="/checkout"
                        prefetch={false}
                        onClick={onClose}
                        className="btn-premium w-full text-[15px] relative overflow-hidden"
                    >
                        <span className="relative z-10 flex w-full items-center justify-center">Checkout</span>
                    </Link>
                    <Link
                        href="/cart"
                        prefetch={false}
                        onClick={onClose}
                        className="btn-secondary dark text-white w-full text-[14px] flex items-center justify-center rounded-[10px]"
                    >
                        View Cart
                    </Link>
                </div>
            </div>
        </div>
    );
}
