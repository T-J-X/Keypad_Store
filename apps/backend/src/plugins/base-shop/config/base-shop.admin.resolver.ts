import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { BaseShopConfig } from './base-shop-config.entity';
import { BaseShopService, type UpdateBaseShopConfigInput } from './base-shop.service';

@Resolver()
export class BaseShopAdminResolver {
  constructor(private baseShopService: BaseShopService) {}

  @Query()
  async baseShopConfig(@Ctx() ctx: RequestContext): Promise<BaseShopConfig> {
    return this.baseShopService.getConfig(ctx);
  }

  @Mutation()
  async updateBaseShopConfig(
    @Ctx() ctx: RequestContext,
    @Args('input') input: UpdateBaseShopConfigInput,
  ): Promise<BaseShopConfig> {
    return this.baseShopService.updateConfig(ctx, input);
  }
}
