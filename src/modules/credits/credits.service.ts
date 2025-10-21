import { Injectable } from '@nestjs/common';
import { CreditsRepository } from './infrastructure/persistence/relational/repositories/credits.repository';

@Injectable()
export class CreditsService {
  constructor(private readonly repo: CreditsRepository) {}

  async hasSufficientCredits(userId: string, cost: number): Promise<boolean> {
    const credits = await this.repo.findByUserId(userId);
  return !!credits && credits.balance >= cost;
  }

  async deductCredits(userId: string, cost: number): Promise<void> {
    const credits = await this.repo.findByUserId(userId);
    if (!credits || credits.balance < cost) throw new Error('Insufficient credits');
    await this.repo.updateBalance(userId, credits.balance - cost);
  }

  async addCredits(userId: string, amount: number): Promise<void> {
    const credits = await this.repo.findByUserId(userId);
    if (!credits) {
      // Si el usuario no tiene registro, lo crea con el monto inicial
      await this.repo.updateBalance(userId, amount);
    } else {
      await this.repo.updateBalance(userId, credits.balance + amount);
    }
  }
}
