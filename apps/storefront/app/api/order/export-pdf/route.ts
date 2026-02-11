import { NextResponse } from 'next/server';
import {
  asStrictConfiguration,
  SLOT_IDS,
  validateAndNormalizeConfigurationInput,
  type SlotId,
} from '../../../../lib/keypadConfiguration';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';
const VENDURE_HOST = process.env.NEXT_PUBLIC_VENDURE_HOST || 'http://localhost:3000';

const ORDER_EXPORT_QUERY = `
  query OrderPdfExportData($orderCode: String!) {
    orderPdfExportData(orderCode: $orderCode) {
      orderId
      orderCode
      orderDate
      customerId
      customerEmail
      customerName
      lines {
        lineId
        quantity
        variantId
        variantName
        variantSku
        configuration
      }
    }
  }
`;

const ICON_CATALOG_QUERY = `
  query IconAssetsForExport($options: ProductListOptions) {
    products(options: $options) {
      totalItems
      items {
        id
        name
        featuredAsset {
          id
          preview
          source
          name
        }
        assets {
          id
          preview
          source
          name
        }
        customFields {
          iconId
          insertAssetId
          isIconProduct
        }
        variants {
          id
          customFields {
            iconId
            insertAssetId
          }
        }
      }
    }
  }
`;

const PAGE_SIZE = 100;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type ExportOrderLine = {
  lineId: string;
  quantity: number;
  variantId: string;
  variantName: string;
  variantSku: string;
  configuration: string;
};

type OrderPdfExportDataResponse = {
  orderPdfExportData: {
    orderId: string;
    orderCode: string;
    orderDate: string;
    customerId: string;
    customerEmail?: string | null;
    customerName?: string | null;
    lines: ExportOrderLine[];
  };
};

type IconProductNode = {
  id: string;
  name: string;
  featuredAsset?: {
    id?: string | null;
    source?: string | null;
    preview?: string | null;
    name?: string | null;
  } | null;
  assets?: Array<{
    id?: string | null;
    source?: string | null;
    preview?: string | null;
    name?: string | null;
  }> | null;
  customFields?: {
    iconId?: string | null;
    insertAssetId?: string | null;
    isIconProduct?: boolean | null;
  } | null;
  variants?: Array<{
    id: string;
    customFields?: {
      iconId?: string | null;
      insertAssetId?: string | null;
    } | null;
  }> | null;
};

type IconProductListResponse = {
  products: {
    totalItems: number;
    items: IconProductNode[];
  };
};

type BodyPayload = {
  orderCode?: unknown;
  configuration?: unknown;
};

type IconAssetMapping = {
  iconId: string;
  iconName: string;
  matteAssetUrl: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as BodyPayload | null;
  const orderCode = typeof body?.orderCode === 'string' ? body.orderCode.trim() : '';

  if (!orderCode) {
    return NextResponse.json({ error: 'orderCode is required.' }, { status: 400 });
  }

  const configurationValidation = validateAndNormalizeConfigurationInput(body?.configuration, { requireComplete: true });
  if (!configurationValidation.ok) {
    return NextResponse.json({ error: configurationValidation.error }, { status: 400 });
  }

  const requestedConfiguration = asStrictConfiguration(configurationValidation.value);
  if (!requestedConfiguration) {
    return NextResponse.json({ error: 'Configuration is incomplete.' }, { status: 400 });
  }

  const orderExportResponse = await queryShopApi<OrderPdfExportDataResponse>(request, {
    query: ORDER_EXPORT_QUERY,
    variables: { orderCode },
  });

  if (!orderExportResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: orderExportResponse.error }, { status: orderExportResponse.status }),
      orderExportResponse.rawResponse,
    );
  }

  const exportData = orderExportResponse.data.orderPdfExportData;
  if (!exportData || (exportData.lines?.length ?? 0) === 0) {
    return withSessionCookie(
      NextResponse.json({ error: 'No configured order lines were found for this order.' }, { status: 400 }),
      orderExportResponse.rawResponse,
    );
  }

  const requestedConfigJson = JSON.stringify(requestedConfiguration);
  const matchingLine = exportData.lines.find((line) => line.configuration === requestedConfigJson);
  if (!matchingLine) {
    return withSessionCookie(
      NextResponse.json(
        { error: 'Provided configuration does not match any configured line on this order.' },
        { status: 400 },
      ),
      orderExportResponse.rawResponse,
    );
  }

  const lineConfigurationValidation = validateAndNormalizeConfigurationInput(matchingLine.configuration, {
    requireComplete: true,
  });
  if (!lineConfigurationValidation.ok) {
    return withSessionCookie(
      NextResponse.json({ error: `Stored line configuration is invalid: ${lineConfigurationValidation.error}` }, { status: 400 }),
      orderExportResponse.rawResponse,
    );
  }

  const iconIds = SLOT_IDS.map((slotId) => requestedConfiguration[slotId].iconId);
  const iconAssetMap = await buildIconAssetMap(request, iconIds);

  const missingIconId = iconIds.find((iconId) => !iconAssetMap.has(iconId));
  if (missingIconId) {
    return withSessionCookie(
      NextResponse.json({ error: `AssetPathError: matte asset missing for iconId ${missingIconId}` }, { status: 422 }),
      orderExportResponse.rawResponse,
    );
  }

  const pdfHtml = renderPdfHtml({
    orderCode: exportData.orderCode,
    orderDate: exportData.orderDate,
    customerName: exportData.customerName ?? exportData.customerEmail ?? null,
    line: matchingLine,
    configuration: requestedConfiguration,
    iconAssetMap,
  });

  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await renderPdfBuffer(pdfHtml);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to render PDF.';
    return withSessionCookie(
      NextResponse.json({ error: message }, { status: 500 }),
      orderExportResponse.rawResponse,
    );
  }

  const pdfArrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength,
  ) as ArrayBuffer;
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

  return withSessionCookie(
    new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Keypad-Config-${exportData.orderCode}.pdf"`,
      },
    }),
    orderExportResponse.rawResponse,
  );
}

async function buildIconAssetMap(request: Request, iconIds: string[]) {
  const products: IconProductNode[] = [];
  let skip = 0;

  while (true) {
    const pageResponse = await queryShopApi<IconProductListResponse>(request, {
      query: ICON_CATALOG_QUERY,
      variables: {
        options: {
          take: PAGE_SIZE,
          skip,
          filter: {
            isIconProduct: { eq: true },
          },
        },
      },
    });

    if (!pageResponse.ok) {
      throw new Error(pageResponse.error);
    }

    const pageItems = pageResponse.data.products.items ?? [];
    products.push(...pageItems);

    const nextSkip = skip + pageItems.length;
    if (pageItems.length === 0 || nextSkip >= pageResponse.data.products.totalItems) {
      break;
    }
    skip = nextSkip;
  }

  const map = new Map<string, IconAssetMapping>();

  for (const product of products) {
    const assets = product.assets ?? [];

    for (const variant of product.variants ?? []) {
      const iconId = (variant.customFields?.iconId ?? product.customFields?.iconId ?? '').trim();
      if (!iconId || !iconIds.includes(iconId)) continue;

      const insertAssetId = (variant.customFields?.insertAssetId ?? product.customFields?.insertAssetId ?? '').trim();
      const matteAsset = resolveInsertAsset(assets, product.featuredAsset?.id ?? null, insertAssetId);
      const matteAssetPath = matteAsset?.source ?? matteAsset?.preview ?? null;
      if (!matteAssetPath) continue;

      map.set(iconId, {
        iconId,
        iconName: product.name,
        matteAssetUrl: toAssetUrl(matteAssetPath),
      });
    }
  }

  return map;
}

function resolveInsertAsset(
  assets: Array<{ id?: string | null; source?: string | null; preview?: string | null; name?: string | null }>,
  featuredAssetId: string | null,
  insertAssetId: string,
) {
  if (insertAssetId) {
    const exact = assets.find((asset) => String(asset.id ?? '').trim() === insertAssetId);
    if (exact) return exact;
  }

  const nonFeatured = assets.filter((asset) => String(asset.id ?? '').trim() !== String(featuredAssetId ?? '').trim());

  const hinted = nonFeatured.find((asset) => {
    const text = `${asset.name ?? ''} ${asset.source ?? ''}`.toLowerCase();
    return text.includes('insert') || text.includes('matte') || text.includes('overlay');
  });

  if (hinted) return hinted;
  return nonFeatured[0] ?? null;
}

function toAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/preview/') || normalized.startsWith('/source/')) {
    return `${VENDURE_HOST}/assets${normalized}`;
  }
  if (normalized.startsWith('/assets/')) {
    return `${VENDURE_HOST}${normalized}`;
  }
  return `${VENDURE_HOST}${normalized}`;
}

async function renderPdfBuffer(html: string) {
  const puppeteerModule = await import('puppeteer');
  const browser = await puppeteerModule.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm',
      },
    });
  } finally {
    await browser.close();
  }
}

function renderPdfHtml({
  orderCode,
  orderDate,
  customerName,
  line,
  configuration,
  iconAssetMap,
}: {
  orderCode: string;
  orderDate: string;
  customerName: string | null;
  line: ExportOrderLine;
  configuration: Record<SlotId, { iconId: string; color: string | null }>;
  iconAssetMap: Map<string, IconAssetMapping>;
}) {
  const formattedDate = new Date(orderDate);
  const dateLabel = Number.isNaN(formattedDate.getTime())
    ? orderDate
    : new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(formattedDate);

  const slotRows = SLOT_IDS.map((slotId) => {
    const slot = configuration[slotId];
    const iconAsset = iconAssetMap.get(slot.iconId)!;
    return {
      slotId,
      iconId: slot.iconId,
      iconName: iconAsset.iconName,
      color: slot.color ?? 'No glow',
      matteAssetUrl: iconAsset.matteAssetUrl,
    };
  });

  const renderSlots = slotRows
    .map((row, index) => {
      const slotPositions = [
        { left: '22%', top: '20%' },
        { left: '54%', top: '20%' },
        { left: '22%', top: '52%' },
        { left: '54%', top: '52%' },
      ];
      const position = slotPositions[index] ?? slotPositions[0];

      const glow = row.color !== 'No glow'
        ? `box-shadow: inset 0 0 0 2px ${row.color}, 0 0 20px ${row.color}66;`
        : 'box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);';

      return `
        <div class="slot" style="left:${position.left};top:${position.top};${glow}">
          <img src="${row.matteAssetUrl}" alt="${escapeHtml(row.iconId)}" />
          <span class="slot-label">${escapeHtml(row.slotId.replace('_', ' '))}</span>
        </div>
      `;
    })
    .join('');

  const bomRows = slotRows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.slotId.replace('_', ' '))}</td>
        <td>${escapeHtml(row.iconId)}</td>
        <td>${escapeHtml(row.iconName)}</td>
        <td>${escapeHtml(row.color)}</td>
      </tr>
    `,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body {
            margin: 0;
            font-family: "Arial", "Helvetica", sans-serif;
            color: #0f1f3d;
            background: #f7f9ff;
          }
          .sheet {
            min-height: 100%;
            border: 1px solid #cdd8ea;
            border-radius: 14px;
            background: linear-gradient(180deg, #ffffff 0%, #f2f6ff 100%);
            padding: 14px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            border-bottom: 1px solid #d3deef;
            padding-bottom: 10px;
          }
          .title {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.06em;
          }
          .meta {
            font-size: 11px;
            line-height: 1.6;
            text-align: right;
          }
          .visual-wrap {
            margin-top: 14px;
            border: 1px solid #d3deef;
            border-radius: 12px;
            background: radial-gradient(140% 120% at 50% -10%, #2c75d8 0%, #15356a 40%, #08152b 100%);
            padding: 14px;
          }
          .visual {
            position: relative;
            margin: 0 auto;
            width: 360px;
            height: 360px;
            border: 1px solid rgba(255,255,255,0.35);
            border-radius: 18px;
            background: #030a18;
          }
          .slot {
            position: absolute;
            width: 24%;
            height: 24%;
            border-radius: 22%;
            border: 1px solid rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.10);
            overflow: hidden;
          }
          .slot img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 12%;
            box-sizing: border-box;
          }
          .slot-label {
            position: absolute;
            left: 4px;
            top: 4px;
            font-size: 8px;
            color: #d9e9ff;
            background: rgba(2, 11, 28, 0.7);
            border-radius: 999px;
            padding: 2px 5px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .bom {
            margin-top: 14px;
          }
          .bom h2 {
            margin: 0 0 6px;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #34527d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #d3deef;
            padding: 6px;
            text-align: left;
          }
          th {
            background: #ebf2ff;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            color: #36567f;
          }
          .footer {
            margin-top: 14px;
            font-size: 10px;
            color: #4f6384;
            border-top: 1px solid #d3deef;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="header">
            <div>
              <div class="title">KEYPAD CO. CUSTOM CONFIGURATION</div>
              <div style="font-size:11px;margin-top:6px;color:#4f6384;">Technical specification sheet</div>
            </div>
            <div class="meta">
              <div><strong>Order:</strong> ${escapeHtml(orderCode)}</div>
              <div><strong>Date:</strong> ${escapeHtml(dateLabel)}</div>
              <div><strong>Customer:</strong> ${escapeHtml(customerName ?? 'N/A')}</div>
              <div><strong>Line SKU:</strong> ${escapeHtml(line.variantSku || line.variantName)}</div>
            </div>
          </section>

          <section class="visual-wrap">
            <div class="visual">
              ${renderSlots}
            </div>
          </section>

          <section class="bom">
            <h2>Bill of Materials</h2>
            <table>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Icon ID</th>
                  <th>Icon Name</th>
                  <th>Glow Color</th>
                </tr>
              </thead>
              <tbody>
                ${bomRows}
              </tbody>
            </table>
          </section>

          <section class="footer">
            <div>Authorized Blink Marine UK Reseller</div>
            <div>support@keypadco.example · +44 0000 000000</div>
          </section>
        </main>
      </body>
    </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function queryShopApi<T>(
  request: Request,
  input: {
    query: string;
    variables?: Record<string, unknown>;
  },
): Promise<
  | {
      ok: true;
      data: T;
      rawResponse: Response;
    }
  | {
      ok: false;
      status: number;
      error: string;
      rawResponse: Response;
    }
> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const rawResponse = await fetch(SHOP_API, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: input.query,
      variables: input.variables,
    }),
  });

  const json = (await rawResponse.json().catch(() => ({}))) as GraphResponse<T>;

  if (!rawResponse.ok || json.errors?.length || !json.data) {
    const message = json.errors?.[0]?.message || `Vendure error (${rawResponse.status})`;
    return {
      ok: false,
      status: rawResponse.ok ? 400 : rawResponse.status,
      error: message,
      rawResponse,
    };
  }

  return {
    ok: true,
    data: json.data,
    rawResponse,
  };
}

function withSessionCookie(response: NextResponse, vendureResponse: Response) {
  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}
