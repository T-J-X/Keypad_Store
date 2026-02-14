import ConfiguratorRingDebugClient from '../../../components/configurator/ConfiguratorRingDebugClient';
import { hasLayoutForModel } from '../../../lib/keypad-layouts';
import { resolveKeypadShellAssetPath } from '../../../lib/keypadShellAsset';
import { resolvePkpModelCode } from '../../../lib/keypadUtils';
import { fetchKeypadProducts } from '../../../lib/vendure.server';

function pickSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function toModelCode(input: string) {
  const normalized = input.trim().toUpperCase();
  if (normalized && hasLayoutForModel(normalized)) return normalized;
  return 'PKP-2200-SI';
}

export default async function ConfiguratorRingDebugPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const modelCode = toModelCode(pickSearchParam(resolvedSearchParams.model));
  const debugMode = pickSearchParam(resolvedSearchParams.debug) === '1'
    || pickSearchParam(resolvedSearchParams.debugSlots) === '1';
  const editMode = pickSearchParam(resolvedSearchParams.edit) === '1';

  let shellAssetPath: string | null = null;
  try {
    const keypads = await fetchKeypadProducts();
    const matched = keypads.find((keypad) => {
      const resolvedModelCode = resolvePkpModelCode(keypad.slug, keypad.name) || keypad.name.toUpperCase();
      return resolvedModelCode === modelCode;
    });
    shellAssetPath = resolveKeypadShellAssetPath(matched?.featuredAsset);
  } catch {
    shellAssetPath = null;
  }

  return (
    <ConfiguratorRingDebugClient
      debugMode={debugMode}
      editMode={editMode}
      modelCode={modelCode}
      shellAssetPath={shellAssetPath}
    />
  );
}
