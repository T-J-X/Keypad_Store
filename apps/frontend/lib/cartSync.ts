type CartSyncPayload = {
  at: number;
};

const CART_SYNC_CHANNEL = 'cart-sync';
const CART_SYNC_STORAGE_KEY = 'kp:cart-sync';

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel() {
  if (typeof window === 'undefined') return null;
  if (typeof BroadcastChannel === 'undefined') return null;
  if (broadcastChannel) return broadcastChannel;
  broadcastChannel = new BroadcastChannel(CART_SYNC_CHANNEL);
  return broadcastChannel;
}

function parsePayload(input: unknown): CartSyncPayload | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as { at?: unknown };
  if (typeof value.at !== 'number' || !Number.isFinite(value.at)) return null;
  return { at: value.at };
}

export function broadcastCartUpdated(payload: CartSyncPayload = { at: Date.now() }) {
  if (typeof window === 'undefined') return;

  const nextPayload = { at: payload.at };
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage(nextPayload);
    return;
  }

  window.localStorage.setItem(CART_SYNC_STORAGE_KEY, JSON.stringify(nextPayload));
}

export function subscribeCartUpdated(handler: () => void) {
  if (typeof window === 'undefined') return () => {};

  const channel = getBroadcastChannel();
  const onMessage = (event: MessageEvent<unknown>) => {
    if (!parsePayload(event.data)) return;
    handler();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_SYNC_STORAGE_KEY || !event.newValue) return;
    let payload: unknown = null;
    try {
      payload = JSON.parse(event.newValue);
    } catch {
      payload = null;
    }
    if (!parsePayload(payload)) return;
    handler();
  };

  if (channel) {
    channel.addEventListener('message', onMessage);
  } else {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', onMessage);
      return;
    }
    window.removeEventListener('storage', onStorage);
  };
}
