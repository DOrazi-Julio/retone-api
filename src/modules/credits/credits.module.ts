import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsEntity } from './domain/credits.entity';
import { CreditsRepository } from './infrastructure/persistence/relational/repositories/credits.repository';
import { CreditsService } from './credits.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditsEntity])],
  providers: [CreditsRepository, CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
