'use client';

import { useSearchParams } from 'next/navigation';
import ConfiguratorRingDebugClient from './ConfiguratorRingDebugClient';

export default function ConfiguratorRingDebugSearchClient() {
  const searchParams = useSearchParams();
  const debugSlots = searchParams.get('debugSlots') === '1';

  return <ConfiguratorRingDebugClient debugSlots={debugSlots} />;
}
