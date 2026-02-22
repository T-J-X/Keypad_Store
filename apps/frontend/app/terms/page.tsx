import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms of Service | VCT',
    description: 'Terms and conditions for use of Vehicle Control Technologies and purchase of products.',
    alternates: {
        canonical: '/terms',
    },
};

export default function TermsPage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-6 pb-20">
            <div className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Terms of Service
                </h1>
                <p className="mt-4 text-ink/60">
                    Last updated: February 15, 2026
                </p>
            </div>

            <div className="prose prose-neutral max-w-none text-ink/80 prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                <p>
                    Welcome to Vehicle Control Technologies. By accessing our website and purchasing our products, you agree to bound by the following terms and conditions.
                </p>

                <h3>1. General</h3>
                <p>
                    These terms apply to all sales and use of our website. We reserve the right to update these terms at any time.
                </p>

                <h3>2. Products & Configuration</h3>
                <p>
                    Our keypads are technical components intended for professional installation.
                </p>
                <ul>
                    <li><strong>Custom Configurations:</strong> Keypads configured via our online tools are built to your specifications. Please verify all layouts and icon selections carefully before ordering.</li>
                    <li><strong>Compatibility:</strong> It is the customer's responsibility to ensure the keypad protocol (e.g., CAN J1939, CANopen) is compatible with their system.</li>
                </ul>

                <h3>3. Returns & Refunds</h3>
                <p>
                    <strong>Standard Products:</strong> Unused standard items may be returned within 30 days of delivery, subject to a restocking fee.
                </p>
                <p>
                    <strong>Custom Configured Items:</strong> Due to the bespoke nature of configured keypads and custom-printed inserts, these items are <strong>non-refundable</strong> unless defective.
                </p>

                <h3>4. Limitation of Liability</h3>
                <p>
                    Vehicle Control Technologies shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our products.
                </p>

                <h3>5. Governing Law</h3>
                <p>
                    These terms are governed by the laws of the United Kingdom.
                </p>

                <p className="border-t pt-8 text-sm text-ink/60">
                    Have questions? <Link href="/contact">Contact Support</Link>
                </p>
            </div>
        </div>
    );
}
