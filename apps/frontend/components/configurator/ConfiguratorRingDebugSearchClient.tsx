'use client';

import { useSearchParams } from 'next/navigation';
import ConfiguratorRingDebugClient from './ConfiguratorRingDebugClient';

export default function ConfiguratorRingDebugSearchClient() {
  const searchParams = useSearchParams();
  const debugMode = searchParams.get('debug') === '1' || searchParams.get('debugSlots') === '1';
  const editMode = searchParams.get('edit') === '1';
  const modelCode = searchParams.get('model') ?? undefined;

  return <ConfiguratorRingDebugClient debugMode={debugMode} editMode={editMode} modelCode={modelCode} />;
}
