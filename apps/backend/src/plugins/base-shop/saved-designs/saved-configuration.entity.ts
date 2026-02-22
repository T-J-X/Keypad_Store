import { Customer, type DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, JoinColumn, ManyToOne, RelationId } from 'typeorm';

@Index('idx_saved_configuration_customer_updated_at', ['customerId', 'updatedAt'])
@Entity()
export class SavedConfiguration extends VendureEntity {
  constructor(input?: DeepPartial<SavedConfiguration>) {
    super(input);
  }

  @Index()
  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  keypadModel!: string;

  // Stored as JSON string to preserve deterministic slot key ordering/format.
  @Column({ type: 'text' })
  configuration!: string;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @RelationId((savedConfiguration: SavedConfiguration) => savedConfiguration.customer)
  customerId!: string;
}
