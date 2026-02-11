import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { SavedConfiguration } from './saved-configuration.entity';
import {
  SavedConfigurationService,
  type SaveConfigurationInput,
  type UpdateConfigurationInput,
} from './saved-configuration.service';

@Resolver()
export class SavedConfigurationShopResolver {
  constructor(private readonly savedConfigurationService: SavedConfigurationService) {}

  @Query()
  async getSavedConfigurations(@Ctx() ctx: RequestContext): Promise<SavedConfiguration[]> {
    return this.savedConfigurationService.getSavedConfigurations(ctx);
  }

  @Query()
  async getSavedConfiguration(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
  ): Promise<SavedConfiguration> {
    return this.savedConfigurationService.getSavedConfigurationById(ctx, id);
  }

  @Mutation()
  async saveConfiguration(
    @Ctx() ctx: RequestContext,
    @Args('name') name: string,
    @Args('keypadModel') keypadModel: string,
    @Args('configJson') configJson: string,
  ): Promise<SavedConfiguration> {
    const input: SaveConfigurationInput = {
      name,
      keypadModel,
      configuration: configJson,
    };

    return this.savedConfigurationService.saveConfiguration(ctx, input);
  }

  @Mutation()
  async updateConfiguration(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
    @Args('name') name: string,
    @Args('configJson') configJson: string,
  ): Promise<SavedConfiguration> {
    const input: UpdateConfigurationInput = {
      id,
      name,
      configuration: configJson,
    };

    return this.savedConfigurationService.updateConfiguration(ctx, input);
  }

  @Mutation()
  async deleteConfiguration(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.savedConfigurationService.deleteConfiguration(ctx, id);
  }
}
