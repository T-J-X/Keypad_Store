import { createContext } from 'react';
import type { KeypadConfiguratorContextValue } from '../types';

export const KeypadContext = createContext<KeypadConfiguratorContextValue | null>(null);
