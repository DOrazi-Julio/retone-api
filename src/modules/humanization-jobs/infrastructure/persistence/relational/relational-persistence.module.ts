import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumanizationJobEntity } from './entities/humanization-job.entity';
import { HumanizationJobRepository } from './repositories/humanization-job.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HumanizationJobEntity])],
  providers: [HumanizationJobRepository],
  exports: [HumanizationJobRepository],
})
export class HumanizationJobsRelationalPersistenceModule {}
