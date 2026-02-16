import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | VCT',
    description: 'How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-6 pb-20">
            <div className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Privacy Policy
                </h1>
                <p className="mt-4 text-ink/60">
                    Last updated: February 15, 2026
                </p>
            </div>

            <div className="prose prose-neutral max-w-none text-ink/80 prose-headings:font-semibold prose-headings:tracking-tight">
                <p>
                    Vehicle Control Technologies ("we", "our", "us") is committed to protecting your privacy. This policy details how we handle your personal information in compliance with the UK Data Protection Act 2018 and the GDPR.
                </p>

                <h3>1. Information We Collect</h3>
                <p>
                    We collect information necessary to process your orders and improve your experience:
                </p>
                <ul>
                    <li><strong>Identity Data:</strong> Name, username, or similar identifier.</li>
                    <li><strong>Contact Data:</strong> Billing address, delivery address, email address, and telephone numbers.</li>
                    <li><strong>Transaction Data:</strong> Details about payments and products you have purchased.</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, and version.</li>
                </ul>

                <h3>2. How We Use Your Data</h3>
                <p>
                    We use your data to:
                </p>
                <ul>
                    <li>Process and deliver your order.</li>
                    <li>Manage our relationship with you (e.g., notifying you about changes to terms or privacy policy).</li>
                    <li>Improve our website, products, and customer relationships.</li>
                </ul>

                <h3>3. Data Retention</h3>
                <p>
                    We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
                </p>

                <h3>4. Your Rights</h3>
                <p>
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data, and (where the lawful ground of processing is consent) to withdraw consent.
                </p>

                <h3>5. Contact Us</h3>
                <p>
                    If you have any questions about this privacy policy or our privacy practices, please contact us at support@vc-tech.co.uk.
                </p>
            </div>
        </div>
    );
}
