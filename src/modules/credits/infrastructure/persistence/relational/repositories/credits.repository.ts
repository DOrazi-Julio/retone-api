import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditsEntity } from '../../../../domain/credits.entity';

@Injectable()
export class CreditsRepository {
  constructor(
    @InjectRepository(CreditsEntity)
    private readonly repo: Repository<CreditsEntity>,
  ) {}

  async findByUserId(userId: string): Promise<CreditsEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async updateBalance(userId: string, balance: number): Promise<void> {
    await this.repo.update(userId, { balance });
  }
}
