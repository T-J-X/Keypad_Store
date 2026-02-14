'use client';

import ConfiguratorActions from './ConfiguratorActions';
import ConfigurationSidebar from './ConfigurationSidebar';
import IconSelectionPopup from './IconSelectionPopup';
import KeypadPreview from './KeypadPreview';
import KeypadProvider from './KeypadProvider';
import SaveDesignModal from './SaveDesignModal';

export const Keypad = {
  Provider: KeypadProvider,
  Preview: KeypadPreview,
  Sidebar: ConfigurationSidebar,
  Actions: ConfiguratorActions,
  IconPicker: IconSelectionPopup,
  SaveDialog: SaveDesignModal,
};
