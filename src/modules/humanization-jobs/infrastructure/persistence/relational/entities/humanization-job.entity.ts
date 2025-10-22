import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HumanizationJobStatus } from '../../../../domain/humanization-job';

@Entity('humanization_jobs')
export class HumanizationJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  inputFileUrl?: string;

  @Column({ nullable: true })
  outputFileUrl?: string;

  @Column({ type: 'int', nullable: true })
  tokensUsed?: number;

  @Column({ type: 'varchar', length: 16 })
  status: HumanizationJobStatus;

  @Column({ nullable: true })
  readability?: string;

  @Column({ nullable: true })
  tone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
