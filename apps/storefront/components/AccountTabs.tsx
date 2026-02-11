'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notifyCartUpdated } from '../lib/cartEvents';
import {
  SLOT_IDS,
  validateAndNormalizeConfigurationInput,
} from '../lib/keypadConfiguration';

type TabId = 'orders' | 'saved';

type SessionSummary = {
  authenticated: boolean;
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
};

type SavedConfigurationRecord = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
  keypadVariantId?: string | null;
};

type SavedConfigurationsResponse = {
  items?: SavedConfigurationRecord[];
  error?: string;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'orders', label: 'Orders' },
  { id: 'saved', label: 'My Saved Designs' },
];

export default function AccountTabs() {
  const [active, setActive] = useState<TabId>('saved');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfigurationRecord[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [enquireId, setEnquireId] = useState<string | null>(null);
  const [enquireNote, setEnquireNote] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const isAuthenticated = session?.authenticated === true;

  const loadSession = useCallback(async () => {
    const response = await fetch('/api/session/summary', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      setSession({ authenticated: false });
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as SessionSummary;
    setSession({
      authenticated: payload.authenticated === true,
      customer: payload.customer ?? null,
    });
  }, []);

  const loadSavedConfigurations = useCallback(async () => {
    setLoadingSaved(true);
    setError(null);

    try {
      const response = await fetch('/api/account/saved-configurations', {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as SavedConfigurationsResponse;
      if (!response.ok) {
        throw new Error(payload.error || 'Could not load saved configurations.');
      }

      setSavedConfigs(payload.items ?? []);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not load saved configurations.';
      setError(message);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadSavedConfigurations();
  }, [isAuthenticated, loadSavedConfigurations]);

  const previewItem = useMemo(
    () => savedConfigs.find((item) => item.id === previewId) ?? null,
    [previewId, savedConfigs],
  );

  const enquireItem = useMemo(
    () => savedConfigs.find((item) => item.id === enquireId) ?? null,
    [enquireId, savedConfigs],
  );

  const customerName = useMemo(() => {
    const first = session?.customer?.firstName?.trim() || '';
    const last = session?.customer?.lastName?.trim() || '';
    const full = `${first} ${last}`.trim();
    return full || session?.customer?.emailAddress || 'your account';
  }, [session?.customer]);

  const onDelete = async (item: SavedConfigurationRecord) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setPendingId(item.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/account/saved-configurations/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not delete this saved design.');
      }

      setSavedConfigs((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback(`Deleted "${item.name}".`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not delete this saved design.';
      setError(message);
    } finally {
      setPendingId(null);
    }
  };

  const onAddToCart = async (item: SavedConfigurationRecord) => {
    const validation = validateAndNormalizeConfigurationInput(item.configuration, { requireComplete: true });
    if (!validation.ok) {
      setError(`Saved configuration "${item.name}" is invalid: ${validation.error}`);
      return;
    }

    if (!item.keypadVariantId) {
      setError(`No keypad variant mapping found for model ${item.keypadModel}.`);
      return;
    }

    setPendingId(item.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/cart/add-item', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productVariantId: item.keypadVariantId,
          quantity: 1,
          customFields: {
            configuration: validation.value,
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not add saved design to cart.');
      }

      notifyCartUpdated();
      setFeedback(`Added "${item.name}" to cart.`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not add saved design to cart.';
      setError(message);
    } finally {
      setPendingId(null);
    }
  };

  const onEnquire = async (item: SavedConfigurationRecord) => {
    setPendingId(item.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/account/saved-configurations/${encodeURIComponent(item.id)}/enquire`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: enquireNote.trim() || undefined }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not send enquiry.');
      }

      setFeedback(`Enquiry sent for "${item.name}".`);
      setEnquireId(null);
      setEnquireNote('');
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not send enquiry.';
      setError(message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="card overflow-hidden p-6">
      <div className="flex flex-wrap gap-2 border-b border-black/5 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`inline-flex min-h-11 min-w-[170px] items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
              active === tab.id
                ? 'bg-ink text-white'
                : 'border border-ink/10 text-ink/60 hover:border-ink/25'
            }`}
            onClick={() => setActive(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {active === 'orders' ? (
          <OrdersPanel />
        ) : (
          <SavedDesignsPanel
            authenticated={isAuthenticated}
            customerName={customerName}
            items={savedConfigs}
            loading={loadingSaved}
            error={error}
            feedback={feedback}
            pendingId={pendingId}
            onDelete={onDelete}
            onAddToCart={onAddToCart}
            onPreview={setPreviewId}
            onEnquireOpen={setEnquireId}
          />
        )}
      </div>

      {previewItem ? (
        <PreviewModal item={previewItem} onClose={() => setPreviewId(null)} />
      ) : null}

      {enquireItem ? (
        <EnquireModal
          item={enquireItem}
          note={enquireNote}
          onNoteChange={setEnquireNote}
          onClose={() => {
            setEnquireId(null);
            setEnquireNote('');
          }}
          onSubmit={() => void onEnquire(enquireItem)}
          pending={pendingId === enquireItem.id}
        />
      ) : null}
    </div>
  );
}

function OrdersPanel() {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-ink">Recent orders</div>
      <div className="card-soft p-4 text-xs text-ink/65">
        Order history integration is pending. Completed orders are still available from your order confirmation page.
      </div>
    </div>
  );
}

function SavedDesignsPanel({
  authenticated,
  customerName,
  items,
  loading,
  error,
  feedback,
  pendingId,
  onDelete,
  onAddToCart,
  onPreview,
  onEnquireOpen,
}: {
  authenticated: boolean;
  customerName: string;
  items: SavedConfigurationRecord[];
  loading: boolean;
  error: string | null;
  feedback: string | null;
  pendingId: string | null;
  onDelete: (item: SavedConfigurationRecord) => void;
  onAddToCart: (item: SavedConfigurationRecord) => void;
  onPreview: (id: string) => void;
  onEnquireOpen: (id: string) => void;
}) {
  if (!authenticated) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold text-ink">Saved configurations</div>
        <div className="card-soft space-y-3 p-4 text-sm text-ink/65">
          <p>Sign in to manage saved keypad designs for {customerName}.</p>
          <div>
            <Link href="/login?redirectTo=%2Faccount" className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-ink">Saved configurations</div>

      {loading ? <div className="card-soft p-4 text-sm text-ink/60">Loading saved designs...</div> : null}
      {error ? <div className="card-soft border border-rose-200 p-4 text-sm font-medium text-rose-700">{error}</div> : null}
      {feedback ? <div className="card-soft border border-emerald-200 p-4 text-sm font-medium text-emerald-700">{feedback}</div> : null}

      {!loading && items.length === 0 ? (
        <div className="card-soft p-4 text-xs text-ink/60">
          No saved configurations yet. Build a keypad in the configurator and use <span className="font-semibold">Save to account</span>.
        </div>
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => {
          const modelSlug = modelCodeToSlug(item.keypadModel);
          const editHref = modelSlug
            ? `/configurator/${modelSlug}?load=${encodeURIComponent(item.id)}`
            : null;

          return (
            <article key={item.id} className="card-soft border border-ink/8 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-ink">{item.name}</h3>
                  <div className="mt-1 text-xs text-ink/55">
                    {item.keypadModel} · Updated {formatDate(item.updatedAt)}
                  </div>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{item.id}</div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                <ActionButton onClick={() => onPreview(item.id)} label="View" />
                {editHref ? (
                  <Link href={editHref} className={actionButtonClass()}>
                    Edit
                  </Link>
                ) : (
                  <span className={actionButtonClass('opacity-50')}>Edit</span>
                )}
                <ActionButton
                  onClick={() => onAddToCart(item)}
                  label={pendingId === item.id ? 'Adding...' : 'Add to cart'}
                  disabled={pendingId === item.id}
                />
                <ActionButton onClick={() => onEnquireOpen(item.id)} label="Enquire" disabled={pendingId === item.id} />
                <ActionButton
                  onClick={() => onDelete(item)}
                  label={pendingId === item.id ? 'Deleting...' : 'Delete'}
                  danger
                  disabled={pendingId === item.id}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PreviewModal({
  item,
  onClose,
}: {
  item: SavedConfigurationRecord;
  onClose: () => void;
}) {
  const parsed = validateAndNormalizeConfigurationInput(item.configuration, { requireComplete: false });

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
            <p className="mt-1 text-xs text-ink/55">{item.keypadModel}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold">
            Close
          </button>
        </div>

        {parsed.ok ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ink/[0.03] text-left text-xs uppercase tracking-[0.12em] text-ink/55">
                  <th className="px-3 py-2">Slot</th>
                  <th className="px-3 py-2">Icon ID</th>
                  <th className="px-3 py-2">Glow</th>
                </tr>
              </thead>
              <tbody>
                {SLOT_IDS.map((slotId) => (
                  <tr key={slotId} className="border-t border-ink/8">
                    <td className="px-3 py-2 font-semibold text-ink">{slotId.replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-ink/75">{parsed.value[slotId].iconId ?? '—'}</td>
                    <td className="px-3 py-2 text-ink/75">{parsed.value[slotId].color ?? 'No glow'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            Stored configuration is invalid: {parsed.error}
          </div>
        )}
      </div>
    </div>
  );
}

function EnquireModal({
  item,
  note,
  onNoteChange,
  onClose,
  onSubmit,
  pending,
}: {
  item: SavedConfigurationRecord;
  note: string;
  onNoteChange: (next: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const prefill = [
    `Configuration: ${item.name}`,
    `Model: ${item.keypadModel}`,
    `Saved ID: ${item.id}`,
    '',
    note,
  ].join('\n');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">Enquire about {item.name}</h3>
            <p className="mt-1 text-xs text-ink/55">Support will receive the full technical spec.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold">
            Close
          </button>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">
          Extra message (optional)
        </label>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-2xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-ink/30"
          placeholder="Any timing, volume, or technical notes for support."
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Preview</label>
        <pre className="mt-2 max-h-44 overflow-auto rounded-2xl border border-ink/10 bg-ink/[0.03] p-3 text-xs leading-5 text-ink/75">
          {prefill}
        </pre>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Sending...' : 'Send enquiry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function modelCodeToSlug(modelCode: string) {
  const normalized = modelCode.trim().toUpperCase();
  if (!normalized) return null;
  if (!/^PKP-\d{4}-SI$/.test(normalized)) return null;
  return normalized.toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function ActionButton({
  onClick,
  label,
  disabled = false,
  danger = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={actionButtonClass(
        danger ? 'text-rose-700 hover:border-rose-300 hover:bg-rose-50' : undefined,
      )}
    >
      {label}
    </button>
  );
}

function actionButtonClass(extra?: string) {
  return [
    'inline-flex min-h-10 items-center justify-center rounded-full border border-ink/14 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink/75 transition',
    'hover:border-ink/30 hover:bg-white',
    'disabled:cursor-not-allowed disabled:opacity-60',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
