import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('credits')
export class CreditsEntity {
  @PrimaryColumn()
  userId: string;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
