import { Suspense } from 'react';
import ConfiguratorRingDebugClient from '../../../components/configurator/ConfiguratorRingDebugClient';
import ConfiguratorRingDebugSearchClient from '../../../components/configurator/ConfiguratorRingDebugSearchClient';

function DebugRingFallback() {
  return <ConfiguratorRingDebugClient debugSlots={false} />;
}

export default function ConfiguratorRingDebugPage() {
  return (
    <Suspense fallback={<DebugRingFallback />}>
      <ConfiguratorRingDebugSearchClient />
    </Suspense>
  );
}
