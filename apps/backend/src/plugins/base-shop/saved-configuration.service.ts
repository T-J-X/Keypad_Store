import { Injectable } from '@nestjs/common';
import {
  Customer,
  ForbiddenError,
  RequestContext,
  TransactionalConnection,
  UserInputError,
} from '@vendure/core';
import { SavedConfiguration } from './saved-configuration.entity';

type SlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';

type SlotConfig = {
  iconId: string;
  color: string | null;
};

type StrictConfig = Record<SlotId, SlotConfig>;

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

const SLOT_IDS: SlotId[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4'];
const ICON_ID_PATTERN = /^[A-Za-z0-9]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

@Injectable()
export class SavedConfigurationService {
  constructor(private connection: TransactionalConnection) {}

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
    existing.configuration = JSON.stringify(this.parseAndValidateConfiguration(input.configuration));

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

  private parseAndValidateConfiguration(raw: string): StrictConfig {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UserInputError('Configuration must be valid JSON.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new UserInputError('Configuration must be an object keyed by slot IDs.');
    }

    const payload = parsed as Record<string, unknown>;

    for (const key of Object.keys(payload)) {
      if (!SLOT_IDS.includes(key as SlotId)) {
        throw new UserInputError(`Unexpected slot key "${key}" in configuration.`);
      }
    }

    const strictConfig = {} as StrictConfig;

    for (const slotId of SLOT_IDS) {
      if (!(slotId in payload)) {
        throw new UserInputError(`Missing required slot "${slotId}" in configuration.`);
      }

      const rawSlot = payload[slotId];
      if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) {
        throw new UserInputError(`Slot "${slotId}" must be an object with iconId and color.`);
      }

      const slot = rawSlot as Record<string, unknown>;
      const iconId = typeof slot.iconId === 'string' ? slot.iconId.trim() : '';
      if (!iconId || !ICON_ID_PATTERN.test(iconId)) {
        throw new UserInputError(`Slot "${slotId}" has an invalid iconId.`);
      }

      let color: string | null = null;
      if (slot.color != null && slot.color !== '') {
        if (typeof slot.color !== 'string') {
          throw new UserInputError(`Slot "${slotId}" has an invalid color. Use #RRGGBB.`);
        }

        const normalizedColor = slot.color.trim().toUpperCase();
        if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
          throw new UserInputError(`Slot "${slotId}" has an invalid color. Use #RRGGBB.`);
        }
        color = normalizedColor;
      }

      strictConfig[slotId] = {
        iconId,
        color,
      };
    }

    return strictConfig;
  }
}
