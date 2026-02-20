const fs = require('fs');

const accountTabs = fs.readFileSync('components/AccountTabs.tsx', 'utf8');

// The file has ~739 lines. The components are top-level functions.
// Let's use regex or split to extract them.
const matchPreview = accountTabs.match(/function PreviewModal\(\{[\s\S]*?\}\s*\{[\s\S]*?\}\n\nfunction EnquireModal/);
const matchEnquire = accountTabs.match(/function EnquireModal\(\{[\s\S]*?\}\s*\{[\s\S]*?\}\n\nfunction formatDate/);
const matchSavedDesigns = accountTabs.match(/function SavedDesignsPanel\(\{[\s\S]*?\}\s*\{[\s\S]*?\}\n\nfunction PreviewModal/);
const matchOrders = accountTabs.match(/function OrdersPanel\(\) \{[\s\S]*?\}\n\nfunction SavedDesignsPanel/);
const matchSharedButtons = accountTabs.match(/const accountPrimaryButtonClass = \[[\s\S]*?const accountPrimaryGlowRingClass =[\s\S]*?';/);
const matchFormatDateAndButtons = accountTabs.match(/function formatDate\([\s\S]*?\}\n\nfunction ActionButton[\s\S]*?\}\n\nfunction actionButtonClass[\s\S]*?\}\n/);

if (!matchPreview || !matchEnquire || !matchSavedDesigns || !matchOrders || !matchSharedButtons || !matchFormatDateAndButtons) {
    console.log("Failed to match all sections");
    process.exit(1);
}

const types = `
export type TabId = 'orders' | 'saved';

export type SessionSummary = {
  authenticated: boolean;
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
};

export type SavedConfigurationRecord = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
  keypadVariantId?: string | null;
};

export type SavedConfigurationsResponse = {
  items?: SavedConfigurationRecord[];
  error?: string;
};
`;

const stylesTsx = `
${matchSharedButtons[0]}

export {
  accountPrimaryButtonClass,
  accountStrongGhostButtonClass,
  accountPrimaryGlowLayerClass,
  accountPrimaryGlowRingClass,
};

${matchFormatDateAndButtons[0].replace('function formatDate', 'export function formatDate').replace('function ActionButton', 'export function ActionButton').replace('function actionButtonClass', 'export function actionButtonClass')}
`;

const previewModalTsx = `
import { useId } from 'react';
import { getGeometryForModel } from '../../config/layouts/geometry';
import { validateAndNormalizeConfigurationInput } from '../../lib/keypadConfiguration';
import { resolvePreviewSlotIds } from '../../lib/configuredKeypadPreview';
import AccessibleModal from '../ui/AccessibleModal';
import { accountStrongGhostButtonClass } from './styles';
import type { SavedConfigurationRecord } from './types';

export ${matchPreview[0].replace('function PreviewModal', 'function PreviewModal').replace('}\n\nfunction EnquireModal', '')}
`;

const enquireModalTsx = `
import { useId } from 'react';
import AccessibleModal from '../ui/AccessibleModal';
import { accountStrongGhostButtonClass, accountPrimaryButtonClass, accountPrimaryGlowLayerClass, accountPrimaryGlowRingClass } from './styles';
import type { SavedConfigurationRecord } from './types';

export ${matchEnquire[0].replace('function EnquireModal', 'function EnquireModal').replace('}\n\nfunction formatDate', '')}
`;

const ordersPanelTsx = `
export ${matchOrders[0].replace('function OrdersPanel', 'function OrdersPanel').replace('}\n\nfunction SavedDesignsPanel', '')}
`;

const savedDesignsPanelTsx = `
import Link from 'next/link';
import ConfiguredKeypadThumbnail from '../configurator/ConfiguredKeypadThumbnail';
import { modelCodeToPkpSlug } from '../../lib/keypadUtils';
import { parseConfigurationForPreview, type ConfiguredIconLookup } from '../../lib/configuredKeypadPreview';
import { accountPrimaryButtonClass, accountPrimaryGlowLayerClass, accountPrimaryGlowRingClass, formatDate, ActionButton } from './styles';
import type { SavedConfigurationRecord } from './types';

export ${matchSavedDesigns[0].replace('function SavedDesignsPanel', 'function SavedDesignsPanel').replace('}\n\nfunction PreviewModal', '')}
`;

fs.writeFileSync('components/account/types.ts', types.trim() + '\\n');
fs.writeFileSync('components/account/styles.tsx', stylesTsx.trim() + '\\n');
fs.writeFileSync('components/account/PreviewModal.tsx', previewModalTsx.trim() + '\\n');
fs.writeFileSync('components/account/EnquireModal.tsx', enquireModalTsx.trim() + '\\n');
fs.writeFileSync('components/account/OrdersPanel.tsx', ordersPanelTsx.trim() + '\\n');
fs.writeFileSync('components/account/SavedDesignsPanel.tsx', savedDesignsPanelTsx.trim() + '\\n');

let newAccountTabs = accountTabs
    .replace(matchOrders[0], '')
    .replace(matchSavedDesigns[0], '')
    .replace(matchPreview[0], '')
    .replace(matchEnquire[0], '')
    .replace(matchFormatDateAndButtons[0], '')
    .replace(matchSharedButtons[0], '')
    .replace(/type TabId = .*?;[\s\S]*?type SavedConfigurationsResponse = \{[\s\S]*?\};\n/, '')
    .replace("import ConfiguredKeypadThumbnail from './configurator/ConfiguredKeypadThumbnail';", "import { OrdersPanel } from './account/OrdersPanel';\\nimport { SavedDesignsPanel } from './account/SavedDesignsPanel';\\nimport { PreviewModal } from './account/PreviewModal';\\nimport { EnquireModal } from './account/EnquireModal';\\nimport type { TabId, SessionSummary, SavedConfigurationRecord, SavedConfigurationsResponse } from './account/types';")
    .replace("import AccessibleModal from './ui/AccessibleModal';", "");

fs.writeFileSync('components/AccountTabs.tsx', newAccountTabs);
console.log("Refactored AccountTabs.tsx");
