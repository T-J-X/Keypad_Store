import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const AccountTabs = dynamic(() => import('../../components/AccountTabs'), {
  loading: () => <div className="card-soft p-4 text-sm text-blue-100/80">Loading account dashboard...</div>,
});

export const metadata: Metadata = {
  title: 'Account | Keypad Store',
  description: 'Manage saved keypad configurations and review orders.',
  alternates: {
    canonical: '/account',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
      <div className="rounded-3xl border border-[#0f2c5a] bg-[radial-gradient(130%_130%_at_50%_0%,#1b5dae_0%,#0e2a55_36%,#050f23_100%)] p-5 shadow-[0_34px_100px_rgba(2,10,28,0.45)] sm:p-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill bg-[#1052ab]">Account</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Your dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-100/80">
              Track orders, save keypad configurations, and keep your workflow ready for deployment.
            </p>
          </div>
        </div>

        <AccountTabs />
      </div>
    </div>
  );
}
