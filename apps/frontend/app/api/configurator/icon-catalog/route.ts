import { NextResponse } from 'next/server';
import { RING_GLOW_OPTIONS } from '../../../../lib/configuratorCatalog';
import { fetchIconCatalog } from '../../../../lib/configurator.server';

export async function GET() {
  try {
    const icons = await fetchIconCatalog();

    return NextResponse.json(
      {
        icons,
        swatches: RING_GLOW_OPTIONS,
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load icon catalog.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
