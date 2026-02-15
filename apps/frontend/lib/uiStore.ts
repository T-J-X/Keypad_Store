'use client';

import { create } from 'zustand';

export type GlobalToastState = {
  message: string;
  ctaLabel: string;
  ctaHref: string;
  visible: boolean;
};

type ShowToastInput = {
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

type UIStoreState = {
  toast: GlobalToastState;
  showToast: (payload: ShowToastInput) => void;
  hideToast: () => void;
};

const emptyToast: GlobalToastState = {
  message: '',
  ctaLabel: '',
  ctaHref: '',
  visible: false,
};

export const useUIStore = create<UIStoreState>((set) => ({
  toast: emptyToast,
  showToast: (payload) => {
    set({
      toast: {
        message: payload.message,
        ctaLabel: payload.ctaLabel,
        ctaHref: payload.ctaHref,
        visible: true,
      },
    });
  },
  hideToast: () => {
    set({ toast: emptyToast });
  },
}));
