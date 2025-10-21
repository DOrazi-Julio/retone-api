import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumanizationJobEntity } from '../entities/humanization-job.entity';

@Injectable()
export class HumanizationJobRepository {
  constructor(
    @InjectRepository(HumanizationJobEntity)
    private readonly repo: Repository<HumanizationJobEntity>,
  ) {}

  async create(job: Partial<HumanizationJobEntity>): Promise<HumanizationJobEntity> {
    const entity = this.repo.create(job);
    return this.repo.save(entity);
  }

  async update(id: string, update: Partial<HumanizationJobEntity>): Promise<void> {
    await this.repo.update(id, update);
  }

  async findById(id: string): Promise<HumanizationJobEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
}
