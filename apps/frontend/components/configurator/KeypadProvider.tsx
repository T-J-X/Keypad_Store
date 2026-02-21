'use client';

import { Suspense } from 'react';
import { KeypadContext } from './keypad-provider/context';
import {
  useKeypadProviderController,
  type KeypadProviderProps,
} from './keypad-provider/useKeypadProviderController';

function KeypadProviderInner(props: KeypadProviderProps) {
  const contextValue = useKeypadProviderController(props);
  return <KeypadContext value={contextValue}>{props.children}</KeypadContext>;
}

export default function KeypadProvider(props: KeypadProviderProps) {
  return (
    <Suspense fallback={props.children}>
      <KeypadProviderInner {...props} />
    </Suspense>
  );
}

export { KeypadContext };
