import { Injectable } from '@nestjs/common';
import {
  Customer,
  ForbiddenError,
  Order,
  RequestContext,
  TransactionalConnection,
  UserInputError,
} from '@vendure/core';
import {
  ConfigurationValidationError,
  parseAndValidateStrictConfiguration,
  type StrictConfiguration,
} from '../saved-designs/keypad-configuration';

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
    try {
      return parseAndValidateStrictConfiguration(raw, 'Stored order configuration');
    } catch (error) {
      if (error instanceof ConfigurationValidationError) {
        throw new UserInputError(error.message);
      }
      throw error;
    }
  }
}
