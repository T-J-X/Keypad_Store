import { NextResponse } from 'next/server';
import { type GraphResponse, normalizeInt, SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';

const ACTIVE_ORDER_QUERY = `
  query ActiveOrder {
    activeOrder {
      id
      code
      currencyCode
      totalQuantity
      subTotalWithTax
      shippingWithTax
      totalWithTax
      lines {
        id
        quantity
        linePriceWithTax
        customFields {
          configuration
        }
        productVariant {
          id
          name
          currencyCode
          product {
            id
            slug
            name
            featuredAsset {
              preview
              source
            }
          }
        }
      }
    }
  }
`;



type ActiveOrderResponse = {
  activeOrder?: {
    id: string;
    code: string;
    currencyCode?: string | null;
    totalQuantity?: number | null;
    subTotalWithTax?: number | null;
    shippingWithTax?: number | null;
    totalWithTax?: number | null;
    lines?: Array<{
      id: string;
      quantity?: number | null;
      linePriceWithTax?: number | null;
      customFields?: {
        configuration?: string | null;
      } | null;
      productVariant?: {
        id: string;
        name?: string | null;
        currencyCode?: string | null;
        product?: {
          id: string;
          slug?: string | null;
          name?: string | null;
          featuredAsset?: {
            preview?: string | null;
            source?: string | null;
          } | null;
        } | null;
      } | null;
    }> | null;
  } | null;
};

export async function GET(request: Request) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  try {
    const vendureResponse = await fetch(SHOP_API_URL, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({ query: ACTIVE_ORDER_QUERY }),
    });

    const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<ActiveOrderResponse>;

    if (!vendureResponse.ok || json.errors?.length) {
      const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
      return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
    }

    const order = json.data?.activeOrder;

    const response = NextResponse.json({
      order: order
        ? {
          id: order.id,
          code: order.code,
          currencyCode: order.currencyCode ?? 'USD',
          totalQuantity: normalizeInt(order.totalQuantity),
          subTotalWithTax: normalizeInt(order.subTotalWithTax),
          shippingWithTax: normalizeInt(order.shippingWithTax),
          totalWithTax: normalizeInt(order.totalWithTax),
          lines: (order.lines ?? []).map((line) => ({
            id: line.id,
            quantity: normalizeInt(line.quantity),
            linePriceWithTax: normalizeInt(line.linePriceWithTax),
            customFields: line.customFields
              ? {
                configuration: line.customFields.configuration ?? null,
              }
              : null,
            productVariant: line.productVariant
              ? {
                id: line.productVariant.id,
                name: line.productVariant.name ?? 'Product variant',
                currencyCode: line.productVariant.currencyCode ?? order.currencyCode ?? 'USD',
                product: line.productVariant.product
                  ? {
                    id: line.productVariant.product.id,
                    slug: line.productVariant.product.slug ?? null,
                    name: line.productVariant.product.name ?? null,
                    featuredAsset: line.productVariant.product.featuredAsset
                      ? {
                        preview: line.productVariant.product.featuredAsset.preview ?? null,
                        source: line.productVariant.product.featuredAsset.source ?? null,
                      }
                      : null,
                  }
                  : null,
              }
              : null,
          })),
        }
        : null,
    });

    return withSessionCookie(response, vendureResponse);
  } catch {
    return NextResponse.json({ order: null });
  }
}

