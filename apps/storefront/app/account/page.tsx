import AccountTabs from '../../components/AccountTabs';

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="pill">Account</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Your dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/60">
            Track orders, save keypad configurations, and keep your workflow ready for deployment.
          </p>
        </div>
      </div>

      <AccountTabs />
    </div>
  );
}
