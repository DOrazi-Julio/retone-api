import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HUMANIZATION_JOBS_QUEUE } from './queue';
import { HumanizationJobsController } from './humanization-jobs.controller';
import { HumanizationJobsService } from './humanization-jobs.service';
import { HumanizationJobsRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CreditsModule } from '../credits/credits.module';
import { FilesModule } from '../../files/files.module';
// HumanizationJobsProcessor must only be loaded in the worker application.
// The API application should NOT include the processor as a provider, otherwise
// it will process jobs itself and consume resources

@Module({
  imports: [
    BullModule.registerQueue({
      name: HUMANIZATION_JOBS_QUEUE,
    }),
    HumanizationJobsRelationalPersistenceModule,
    CreditsModule,
    FilesModule,
  ],
  controllers: [HumanizationJobsController],
  providers: [HumanizationJobsService],
})
export class HumanizationJobsModule {}
