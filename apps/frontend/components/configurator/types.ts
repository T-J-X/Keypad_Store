import type { KeypadModelGeometry } from '../../config/layouts/geometry';
import type { IconCatalogItem } from '../../lib/configuratorCatalog';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type {
  KeypadConfigurationDraft,
  SlotId,
} from '../../lib/keypadConfiguration';

export type StatusMessage = {
  type: 'success' | 'error';
  message: string;
};

export type SavedConfigurationItem = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionSummary = {
  authenticated: boolean;
  activeCustomer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
  activeOrder: {
    id: string;
    totalQuantity: number;
    totalWithTax: number;
    currencyCode: string;
  } | null;
};

export type PilotKeypadProduct = {
  id: string;
  slug: string;
  name: string;
  modelCode: string;
  description?: string | null;
  shellAssetPath: string | null;
  productVariantId: string | null;
};

export type KeypadConfiguratorMode = 'new' | 'edit-line';

export type KeypadConfiguratorBusyState = {
  iconsLoading: boolean;
  loadingSavedConfig: boolean;
  addingToCart: boolean;
  savingToAccount: boolean;
  downloadingPdf: boolean;
};

export type KeypadPreviewState = {
  rotationDeg: number;
  showGlows: boolean;
  iconScale: number;
  iconVisibleComp: number;
  debugMode: boolean;
  editMode: boolean;
  descriptionText: string;
};

export type KeypadConfiguratorState = {
  modelCode: string;
  slotIds: SlotId[];
  slotLabels: Record<string, string>;
  slots: Record<string, SlotVisualState>;
  popupSlotId: SlotId | null;
  selectedIconIds: string[];
  recommendationSeedIconId: string | null;
  isMobile: boolean;
  isAuthenticated: boolean | null;
  mode: KeypadConfiguratorMode;
  isComplete: boolean;
  hasVariant: boolean;
  hasLoadedSavedConfig: boolean;
  canOpenSaveAction: boolean;
  canDownloadPdf: boolean;
  saveModalOpen: boolean;
  savedDesignsModalOpen: boolean;
  saveName: string;
  icons: IconCatalogItem[];
  iconsError: string | null;
  savedConfigError: string | null;
  savedDesigns: SavedConfigurationItem[];
  savedDesignsLoading: boolean;
  savedDesignsError: string | null;
  cartStatus: StatusMessage | null;
  saveStatus: StatusMessage | null;
  busy: {
    iconsLoading: boolean;
    loadingSavedConfig: boolean;
    addingToCart: boolean;
    savingToAccount: boolean;
    downloadingPdf: boolean;
  };
  preview: {
    rotationDeg: number;
    showGlows: boolean;
    iconScale: number;
    iconVisibleComp: number | undefined;
    debugMode: boolean;
    editMode: boolean;
    descriptionText: string;
  };
};

export type KeypadConfiguratorActions = {
  resetSlots: () => void;
  openSlot: (slotId: SlotId) => void;
  closeSlot: () => void;
  clearSlot: (slotId: SlotId) => void;
  selectIconForSlot: (slotId: SlotId, icon: IconCatalogItem) => void;
  setSlotGlowForSlot: (slotId: SlotId, color: string | null) => void;
  rotatePreview: () => void;
  togglePreviewGlows: () => void;
  addToCart: () => Promise<void>;
  openSaveModal: () => void;
  closeSaveModal: () => void;
  openSavedDesignsModal: () => void;
  closeSavedDesignsModal: () => void;
  submitSave: () => Promise<void>;
  setSaveName: (name: string) => void;
  downloadPdf: () => Promise<void>;
};

export type KeypadConfiguratorMeta = {
  keypad: PilotKeypadProduct;
  geometry: KeypadModelGeometry;
  configurationDraft: KeypadConfigurationDraft;
  slotCount: number;
  editLineId: string | null;
  loadSavedId: string | null;
};

export type KeypadConfiguratorContextValue = {
  state: KeypadConfiguratorState;
  actions: KeypadConfiguratorActions;
  meta: KeypadConfiguratorMeta;
};
