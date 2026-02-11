import { Injectable } from '@nestjs/common';
import {
  Customer,
  ForbiddenError,
  Order,
  RequestContext,
  TransactionalConnection,
  UserInputError,
} from '@vendure/core';

type SlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';

type SlotConfig = {
  iconId: string;
  color: string | null;
};

export type StrictConfiguration = Record<SlotId, SlotConfig>;

export type OrderPdfExportLine = {
  lineId: string;
  quantity: number;
  variantId: string;
  variantName: string;
  variantSku: string;
  configuration: string;
};

export type OrderPdfExportPayload = {
  orderId: string;
  orderCode: string;
  orderDate: Date;
  customerId: string;
  customerEmail: string | null;
  customerName: string | null;
  lines: OrderPdfExportLine[];
};

const SLOT_IDS: SlotId[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4'];
const ICON_ID_PATTERN = /^[A-Za-z0-9]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

@Injectable()
export class OrderExportService {
  constructor(private readonly connection: TransactionalConnection) {}

  async getOrderPdfExportData(ctx: RequestContext, orderCode: string): Promise<OrderPdfExportPayload> {
    const customer = await this.getActiveCustomerOrThrow(ctx);
    const normalizedOrderCode = String(orderCode || '').trim();
    if (!normalizedOrderCode) {
      throw new UserInputError('Order code is required.');
    }

    const orderRepo = this.connection.getRepository(ctx, Order);
    const order = await orderRepo.findOne({
      where: { code: normalizedOrderCode },
      relations: {
        customer: true,
        lines: {
          productVariant: true,
        },
      },
    });

    if (!order || !order.customer || String(order.customer.id) !== String(customer.id)) {
      throw new ForbiddenError();
    }

    const lines: OrderPdfExportLine[] = [];

    for (const line of order.lines ?? []) {
      const configurationRaw = (line as unknown as { customFields?: { configuration?: unknown } })
        .customFields?.configuration;

      if (typeof configurationRaw !== 'string') {
        continue;
      }

      const strictConfiguration = this.parseAndValidateConfiguration(configurationRaw);

      lines.push({
        lineId: String(line.id),
        quantity: Math.max(1, Math.trunc(line.quantity ?? 1)),
        variantId: line.productVariant ? String(line.productVariant.id) : 'unknown-variant',
        variantName: line.productVariant?.name?.trim() || 'Configured keypad',
        variantSku: line.productVariant?.sku?.trim() || '',
        configuration: JSON.stringify(strictConfiguration),
      });
    }

    if (lines.length === 0) {
      throw new UserInputError('No configured keypad lines were found for this order.');
    }

    const customerName = `${order.customer.firstName ?? ''} ${order.customer.lastName ?? ''}`.trim() || null;

    return {
      orderId: String(order.id),
      orderCode: order.code,
      orderDate: order.createdAt,
      customerId: String(order.customer.id),
      customerEmail: order.customer.emailAddress ?? null,
      customerName,
      lines,
    };
  }

  private async getActiveCustomerOrThrow(ctx: RequestContext): Promise<Customer> {
    if (!ctx.activeUserId) {
      throw new ForbiddenError();
    }

    const customerRepo = this.connection.getRepository(ctx, Customer);
    const customer = await customerRepo
      .createQueryBuilder('customer')
      .leftJoin('customer.user', 'user')
      .where('user.id = :userId', { userId: String(ctx.activeUserId) })
      .getOne();

    if (!customer) {
      throw new ForbiddenError();
    }

    return customer;
  }

  private parseAndValidateConfiguration(raw: string): StrictConfiguration {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UserInputError('Stored order configuration is invalid JSON.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new UserInputError('Stored order configuration is invalid.');
    }

    const payload = parsed as Record<string, unknown>;
    const strictConfiguration = {} as StrictConfiguration;

    for (const slotId of SLOT_IDS) {
      const rawSlot = payload[slotId];
      if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) {
        throw new UserInputError(`Stored order configuration missing ${slotId}.`);
      }

      const slot = rawSlot as Record<string, unknown>;
      const iconId = typeof slot.iconId === 'string' ? slot.iconId.trim() : '';
      if (!iconId || !ICON_ID_PATTERN.test(iconId)) {
        throw new UserInputError(`Stored order configuration has invalid iconId in ${slotId}.`);
      }

      let color: string | null = null;
      if (slot.color != null && slot.color !== '') {
        if (typeof slot.color !== 'string') {
          throw new UserInputError(`Stored order configuration has invalid color in ${slotId}.`);
        }

        const normalizedColor = slot.color.trim().toUpperCase();
        if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
          throw new UserInputError(`Stored order configuration has invalid color in ${slotId}.`);
        }
        color = normalizedColor;
      }

      strictConfiguration[slotId] = {
        iconId,
        color,
      };
    }

    return strictConfiguration;
  }
}
