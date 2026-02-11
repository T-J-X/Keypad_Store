import { Query, Resolver, Args } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { OrderExportService, type OrderPdfExportPayload } from './order-export.service';

@Resolver()
export class OrderExportShopResolver {
  constructor(private readonly orderExportService: OrderExportService) {}

  @Query()
  async orderPdfExportData(
    @Ctx() ctx: RequestContext,
    @Args('orderCode') orderCode: string,
  ): Promise<OrderPdfExportPayload> {
    return this.orderExportService.getOrderPdfExportData(ctx, orderCode);
  }
}
