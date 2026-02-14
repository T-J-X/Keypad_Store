'use client';

import dynamic from 'next/dynamic';
import ConfigurationSidebar from './ConfigurationSidebar';
import KeypadPreview from './KeypadPreview';
import KeypadProvider, { KeypadContext } from './KeypadProvider';
import SaveDesignModal from './SaveDesignModal';

const ConfiguratorActions = dynamic(() => import('./ConfiguratorActions'));
const IconSelectionPopup = dynamic(() => import('./IconSelectionPopup'));

export const Keypad = {
  Provider: KeypadProvider,
  Context: KeypadContext,
  Preview: KeypadPreview,
  Sidebar: ConfigurationSidebar,
  Actions: ConfiguratorActions,
  IconPicker: IconSelectionPopup,
  SaveDialog: SaveDesignModal,
};
