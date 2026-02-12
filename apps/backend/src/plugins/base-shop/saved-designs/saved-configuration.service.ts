import { Injectable } from '@nestjs/common';
import {
  Customer,
  ForbiddenError,
  ProductService,
  RequestContext,
  TransactionalConnection,
  UserInputError,
} from '@vendure/core';
import {
  ConfigurationValidationError,
  findMissingIconIds,
  parseAndValidateStrictConfiguration,
  type StrictConfiguration,
} from './keypad-configuration';
import { SavedConfiguration } from './saved-configuration.entity';

export type SaveConfigurationInput = {
  name: string;
  keypadModel: string;
  configuration: string;
};

export type UpdateConfigurationInput = {
  id: string;
  name: string;
  configuration: string;
};

@Injectable()
export class SavedConfigurationService {
  constructor(
    private connection: TransactionalConnection,
    private productService: ProductService,
  ) {}

  async getSavedConfigurations(ctx: RequestContext): Promise<SavedConfiguration[]> {
    const customer = await this.getActiveCustomerOrThrow(ctx);

    return this.connection.getRepository(ctx, SavedConfiguration).find({
      where: {
        customer: { id: String(customer.id) } as Customer,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async getSavedConfigurationById(ctx: RequestContext, id: string): Promise<SavedConfiguration> {
    const customer = await this.getActiveCustomerOrThrow(ctx);
    return this.getOwnedConfigurationOrThrow(ctx, String(customer.id), id);
  }

  async saveConfiguration(ctx: RequestContext, input: SaveConfigurationInput): Promise<SavedConfiguration> {
    const customer = await this.getActiveCustomerOrThrow(ctx);
    const normalizedName = this.normalizeName(input.name);
    const keypadModel = this.normalizeKeypadModel(input.keypadModel);
    const strictConfiguration = this.parseAndValidateConfiguration(input.configuration);
    await this.assertIconIdsExist(ctx, strictConfiguration);

    const repo = this.connection.getRepository(ctx, SavedConfiguration);
    const entity = repo.create({
      name: normalizedName,
      keypadModel,
      configuration: JSON.stringify(strictConfiguration),
      customer,
    });

    return repo.save(entity);
  }

  async updateConfiguration(ctx: RequestContext, input: UpdateConfigurationInput): Promise<SavedConfiguration> {
    const customer = await this.getActiveCustomerOrThrow(ctx);
    const normalizedId = String(input.id || '').trim();
    if (!normalizedId) {
      throw new UserInputError('Configuration id is required.');
    }

    const existing = await this.getOwnedConfigurationOrThrow(ctx, String(customer.id), normalizedId);
    existing.name = this.normalizeName(input.name);
    const strictConfiguration = this.parseAndValidateConfiguration(input.configuration);
    await this.assertIconIdsExist(ctx, strictConfiguration);
    existing.configuration = JSON.stringify(strictConfiguration);

    return this.connection.getRepository(ctx, SavedConfiguration).save(existing);
  }

  async deleteConfiguration(ctx: RequestContext, id: string): Promise<boolean> {
    const customer = await this.getActiveCustomerOrThrow(ctx);
    const normalizedId = String(id || '').trim();
    if (!normalizedId) {
      throw new UserInputError('Configuration id is required.');
    }

    const existing = await this.getOwnedConfigurationOrThrow(ctx, String(customer.id), normalizedId);
    await this.connection.getRepository(ctx, SavedConfiguration).remove(existing);
    return true;
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

  private async getOwnedConfigurationOrThrow(
    ctx: RequestContext,
    customerId: string,
    id: string,
  ): Promise<SavedConfiguration> {
    const repo = this.connection.getRepository(ctx, SavedConfiguration);
    const entity = await repo
      .createQueryBuilder('savedConfiguration')
      .leftJoin('savedConfiguration.customer', 'customer')
      .where('savedConfiguration.id = :id', { id })
      .andWhere('customer.id = :customerId', { customerId })
      .getOne();
    if (!entity) {
      throw new UserInputError('Saved configuration not found.');
    }

    return entity;
  }

  private normalizeName(value: string): string {
    const name = String(value || '').trim();
    if (!name) {
      throw new UserInputError('Configuration name cannot be empty.');
    }

    return name.slice(0, 160);
  }

  private normalizeKeypadModel(value: string): string {
    const model = String(value || '').trim().toUpperCase();
    if (!model) {
      throw new UserInputError('Keypad model is required.');
    }

    return model.slice(0, 64);
  }

  private parseAndValidateConfiguration(raw: string): StrictConfiguration {
    try {
      return parseAndValidateStrictConfiguration(raw);
    } catch (error) {
      if (error instanceof ConfigurationValidationError) {
        throw new UserInputError(error.message);
      }
      throw error;
    }
  }

  private async assertIconIdsExist(ctx: RequestContext, configuration: StrictConfiguration) {
    const missingIconIds = await findMissingIconIds(ctx, this.productService, configuration);
    if (missingIconIds.length > 0) {
      throw new UserInputError(`Unknown iconId(s): ${missingIconIds.join(', ')}.`);
    }
  }
}
