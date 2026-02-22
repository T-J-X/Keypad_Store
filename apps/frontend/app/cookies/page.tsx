import type { Metadata } from 'next';
import { buildPageMetadata } from '../../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
    title: 'Cookie Policy',
    description: 'Information about the cookies we use on our website.',
    canonical: '/cookies',
});

export default function CookiesPage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-6 pb-20">
            <div className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Cookie Policy
                </h1>
                <p className="mt-4 text-ink/60">
                    Last updated: February 15, 2026
                </p>
            </div>

            <div className="prose prose-neutral max-w-none text-ink/80 prose-headings:font-semibold prose-headings:tracking-tight">
                <p>
                    Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                </p>

                <h3>1. What are cookies?</h3>
                <p>
                    A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive.
                </p>

                <h3>2. Types of Cookies We Use</h3>
                <p>We use the following cookies:</p>
                <ul>
                    <li>
                        <strong>Strictly necessary cookies.</strong> These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart, or make use of e-billing services.
                    </li>
                    <li>
                        <strong>Analytical or performance cookies.</strong> These allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.
                    </li>
                    <li>
                        <strong>Functionality cookies.</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences (for example, your choice of language or region).
                    </li>
                </ul>

                <h3>3. Managing Cookies</h3>
                <p>
                    You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our website.
                </p>
                <p>
                    You can also manage your preferences via our cookie banner which appears on your first visit, or by clicking "Cookie Settings" in the footer.
                </p>
            </div>
        </div>
    );
}
