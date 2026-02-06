import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { assetUrl, categoryOf, fetchIconProducts, pickInsertAsset, type IconProduct } from './vendure';

type Slot = {
  key: string;
  label: string;
  x: number; // 0..1 (center)
  y: number; // 0..1 (center)
  size: number; // 0..1 (diameter relative to the keypad width)
};

type KeypadModel = {
  key: string;
  name: string;
  cols: number;
  rows: number;
  slotSize: number;
  marginX: number;
  marginY: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildGridSlots(model: KeypadModel): Slot[] {
  const xs =
    model.cols === 1
      ? [0.5]
      : Array.from({ length: model.cols }, (_, i) =>
          lerp(model.marginX, 1 - model.marginX, i / (model.cols - 1)),
        );
  const ys =
    model.rows === 1
      ? [0.5]
      : Array.from({ length: model.rows }, (_, i) =>
          lerp(model.marginY, 1 - model.marginY, i / (model.rows - 1)),
        );

  const slots: Slot[] = [];
  let n = 1;
  for (let r = 0; r < model.rows; r++) {
    for (let c = 0; c < model.cols; c++) {
      slots.push({
        key: `r${r + 1}c${c + 1}`,
        label: String(n++),
        x: xs[c],
        y: ys[r],
        size: model.slotSize,
      });
    }
  }
  return slots;
}

const MODELS: KeypadModel[] = [
  { key: '2x2', name: '2 x 2 (4 slots)', cols: 2, rows: 2, slotSize: 0.28, marginX: 0.28, marginY: 0.28 },
  { key: '3x2', name: '3 x 2 (6 slots)', cols: 3, rows: 2, slotSize: 0.24, marginX: 0.22, marginY: 0.30 },
  { key: '4x2', name: '4 x 2 (8 slots)', cols: 4, rows: 2, slotSize: 0.20, marginX: 0.17, marginY: 0.30 },
  { key: '5x2', name: '5 x 2 (10 slots)', cols: 5, rows: 2, slotSize: 0.18, marginX: 0.14, marginY: 0.30 },
  { key: '5x3', name: '5 x 3 (15 slots)', cols: 5, rows: 3, slotSize: 0.16, marginX: 0.14, marginY: 0.22 },
];

function productThumb(p: IconProduct) {
  return assetUrl(p.featuredAsset ?? p.assets?.[0] ?? null, 'preview');
}

function productInsert(p: IconProduct) {
  const a = pickInsertAsset(p);
  return assetUrl(a, 'source') || assetUrl(a, 'preview');
}

export function App() {
  const [status, setStatus] = useState<string>('Loading icons…');
  const [error, setError] = useState<string | null>(null);
  const [icons, setIcons] = useState<IconProduct[]>([]);

  const [modelKey, setModelKey] = useState<string>(MODELS[0].key);
  const model = MODELS.find((m) => m.key === modelKey) ?? MODELS[0];
  const slots = useMemo(() => buildGridSlots(model), [model]);

  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const [slotIcons, setSlotIcons] = useState<Record<string, IconProduct | null>>({});

  useEffect(() => {
    let cancelled = false;
    fetchIconProducts()
      .then((items) => {
        if (cancelled) return;
        setIcons(items);
        setStatus(`Loaded ${items.length} icons`);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('Error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const changeModel = (next: string) => {
    setModelKey(next);
    setSlotIcons({});
    setActiveSlotKey(null);
    setIsModalOpen(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of icons) set.add(categoryOf(p));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [icons]);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return icons
      .filter((p) => (activeCategory === 'All' ? true : categoryOf(p) === activeCategory))
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.customFields?.iconId ?? ''} ${p.name ?? ''} ${p.slug ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [icons, activeCategory, search]);

  const openForSlot = (slotKey: string) => {
    setActiveSlotKey(slotKey);
    setActiveCategory('All');
    setSearch('');
    setIsModalOpen(true);
  };

  const selectIcon = (p: IconProduct) => {
    if (!activeSlotKey) return;
    setSlotIcons((prev) => ({ ...prev, [activeSlotKey]: p }));
    setIsModalOpen(false);
  };

  const clearSlot = () => {
    if (!activeSlotKey) return;
    setSlotIcons((prev) => ({ ...prev, [activeSlotKey]: null }));
    setIsModalOpen(false);
  };

  const clearAll = () => setSlotIcons({});

  const selectedList = useMemo(() => {
    return slots
      .map((s) => ({ slot: s, icon: slotIcons[s.key] ?? null }))
      .filter((x) => !!x.icon) as Array<{ slot: Slot; icon: IconProduct }>;
  }, [slots, slotIcons]);

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">Sandbox Configurator</div>
        <div className="status">{status}</div>
      </div>

      <div className="layout">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="title">Keypad</div>
              <div className="sub">Click a slot to choose an icon (Render in popup → Insert overlay in slot)</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                Model
                <select
                  value={modelKey}
                  onChange={(e) => changeModel(e.target.value)}
                  className="btn ghost"
                  style={{ padding: '10px 12px' }}
                >
                  {MODELS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn" onClick={clearAll} disabled={selectedList.length === 0}>
                Clear all
              </button>
            </div>
          </div>

          {error ? (
            <div className="notice error">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Couldn’t load icons</div>
              <div className="muted">
                {error}. Make sure Vendure is running on <code>http://localhost:3000</code> and that the icon custom
                fields are marked <code>public</code>.
              </div>
            </div>
          ) : null}

          <div className="keypad" aria-label="Keypad">
            <div className="plate" />
            {slots.map((s) => {
              const icon = slotIcons[s.key] ?? null;
              const insert = icon ? productInsert(icon) : '';
              const isActive = activeSlotKey === s.key && isModalOpen;
              return (
                <button
                  key={s.key}
                  className={`slot${isActive ? ' active' : ''}`}
                  style={{
                    left: `${s.x * 100}%`,
                    top: `${s.y * 100}%`,
                    width: `${s.size * 100}%`,
                    height: `${s.size * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => openForSlot(s.key)}
                  title={icon?.customFields?.iconId ? `Slot ${s.label}: ${icon.customFields.iconId}` : `Slot ${s.label}`}
                >
                  <div className="slotRing" />
                  {insert ? <img className="insert" src={insert} alt="" /> : <div className="slotEmpty">{s.label}</div>}
                </button>
              );
            })}
          </div>

          <div className="legend">
            <div className="muted">
              {selectedList.length}/{slots.length} slots filled
            </div>
            <button className="btn ghost" onClick={() => setIsModalOpen(true)} disabled={!activeSlotKey}>
              Open picker
            </button>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="title">Selection</div>
              <div className="sub">This is just a sandbox proving the asset model.</div>
            </div>
            <button
              className="btn ghost"
              onClick={() => {
                setError(null);
                setStatus('Loading icons…');
                fetchIconProducts()
                  .then((items) => {
                    setIcons(items);
                    setStatus(`Loaded ${items.length} icons`);
                  })
                  .catch((e: unknown) => {
                    setError(e instanceof Error ? e.message : String(e));
                    setStatus('Error');
                  });
              }}
            >
              Reload icons
            </button>
          </div>

          <div className="notice">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick sanity checks</div>
            <div className="muted">
              Thumbnail uses <code>featuredAsset</code> (Render). Slot overlay uses <code>insertAssetId</code> (Insert) or
              falls back to the non-featured asset.
            </div>
          </div>

          <div style={{ height: 12 }} />

          {selectedList.length === 0 ? (
            <div className="muted">Pick a slot and choose an icon.</div>
          ) : (
            <div className="gridMini" aria-label="Selected icons">
              {selectedList.map(({ slot, icon }) => (
                <div key={slot.key} className="mini">
                  <img src={productThumb(icon)} alt="" />
                  <div className="miniMeta">
                    <div className="miniName">
                      Slot {slot.label} • <code>{icon.customFields?.iconId ?? icon.slug}</code>
                    </div>
                    <div className="miniCat">{categoryOf(icon)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="modalBackdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="title">Choose an Icon</div>
                <div className="sub">
                  Slot {activeSlotKey ? slots.find((s) => s.key === activeSlotKey)?.label ?? '' : ''} •{' '}
                  <span className="muted">{filteredIcons.length} shown</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search (e.g. B321)…"
                  className="btn ghost"
                  style={{ width: 260 }}
                />
                <button className="btn" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div className="modalBody">
              <div className="cats">
                {categories.map((c) => (
                  <button
                    key={c}
                    className={`cat${c === activeCategory ? ' active' : ''}`}
                    onClick={() => setActiveCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="grid">
                {filteredIcons.map((p) => (
                  <button key={p.id} className="iconCard" onClick={() => selectIcon(p)} title={p.name}>
                    <img src={productThumb(p)} alt="" />
                    <div className="iconMeta">
                      <div className="iconId">
                        <code>{p.customFields?.iconId ?? p.slug}</code>
                      </div>
                      <div className="iconName">{p.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="modalFooter" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div className="muted">
                Tip: set <code>customFields.insertAssetId</code> to make overlay unambiguous.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn ghost" onClick={clearSlot} disabled={!activeSlotKey || !slotIcons[activeSlotKey]}>
                  Clear slot
                </button>
                <button className="btn" onClick={() => setIsModalOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
