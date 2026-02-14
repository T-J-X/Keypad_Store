type ShellAssetLike = {
  source?: string | null;
  preview?: string | null;
} | null | undefined;

export function resolveKeypadShellAssetPath(asset: ShellAssetLike): string | null {
  const source = typeof asset?.source === 'string' ? asset.source.trim() : '';
  if (source) return source;

  const preview = typeof asset?.preview === 'string' ? asset.preview.trim() : '';
  if (preview) return preview;

  return null;
}
