import { Injectable, Inject, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { CreateHumanizationJobDto } from './dto/create-humanization-job.dto';
import { HumanizationJobDto } from './dto/humanization-job.dto';
import { HumanizationJobRepository } from './infrastructure/persistence/relational/repositories/humanization-job.repository';
import { HumanizationJobMapper } from './infrastructure/persistence/relational/mappers/humanization-job.mapper';
import { CreditsService } from '../credits/credits.service';
import { FilesService } from '../../files/files.service';
import { InjectQueue } from '@nestjs/bull';
import { HUMANIZATION_JOBS_QUEUE } from './queue';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { HumanizationJob, HumanizationJobStatus } from './domain/humanization-job';
import { HumanizationJobEntity } from './infrastructure/persistence/relational/entities/humanization-job.entity';

const HUMANIZATION_CREDIT_COST = 1;

@Injectable()
export class HumanizationJobsService {
  constructor(
    private readonly jobRepo: HumanizationJobRepository,
    private readonly creditsService: CreditsService,
    private readonly filesService: FilesService,
    @InjectQueue(HUMANIZATION_JOBS_QUEUE) private readonly queue: Queue,
  ) {}

  private readonly logger = new Logger(HumanizationJobsService.name);
  // High level createJob orchestrates smaller helper methods for readability.
  async createJob(dto: CreateHumanizationJobDto): Promise<HumanizationJobDto> {
    await this.checkAndDeductCredits(dto.userId);

    const jobId = uuidv4();
    const inputFileId = await this.filesService.uploadTextFile(
      `jobs/${jobId}/input.txt`,
      dto.inputText,
    );

    const job = await this.persistJobRecord({
      id: jobId,
      userId: dto.userId,
      inputFileUrl: inputFileId,
      readability: dto.readability,
      tone: dto.tone,
    });

    await this.enqueueOrRollback(jobId, dto.userId, dto.readability, dto.tone);

    return this.toDto(job);
  }

  private async checkAndDeductCredits(userId: string): Promise<void> {
    const hasCredits = await this.creditsService.hasSufficientCredits(
      userId,
      HUMANIZATION_CREDIT_COST,
    );
    if (!hasCredits) throw new BadRequestException('Insufficient credits');
    await this.creditsService.deductCredits(userId, HUMANIZATION_CREDIT_COST);
  }

  private async persistJobRecord(partial: Partial<HumanizationJobEntity>) {
    const entity = await this.jobRepo.create({
      ...partial,
      status: HumanizationJobStatus.PENDING,
    });
    return HumanizationJobMapper.toDomain(entity);
  }

  private async enqueueOrRollback(jobId: string, userId: string, readability?: string, tone?: string) {
    try {
      const queued = await this.queue.add('process', { jobId, readability, tone });
      this.logger.log(`Enqueued job ${jobId} (id=${queued.id})`);
    } catch (err) {
      this.logger.error(`Failed enqueuing job ${jobId}`, err as any);
      await this.handleEnqueueFailure(jobId, userId);
    }
  }

  private async handleEnqueueFailure(jobId: string, userId: string) {
    try {
      await this.jobRepo.update(jobId, { status: HumanizationJobStatus.FAILED });
    } catch (uerr) {
      this.logger.warn(`Failed to update job status to FAILED for ${jobId}`, uerr as any);
    }

    try {
      await this.creditsService.addCredits(userId, HUMANIZATION_CREDIT_COST);
      this.logger.log(`Refunded ${HUMANIZATION_CREDIT_COST} credits to user ${userId} after enqueue failure`);
    } catch (cerr) {
      this.logger.warn(`Failed to refund credits to user ${userId}`, cerr as any);
    }

    throw new InternalServerErrorException('Failed to enqueue job, please try again later');
  }

  private toDto(job: HumanizationJob): HumanizationJobDto {
    return {
      id: job.id,
      userId: job.userId,
      inputFileUrl: job.inputFileUrl,
      outputFileUrl: job.outputFileUrl,
      tokensUsed: job.tokensUsed,
      status: job.status,
      createdAt: job.createdAt!,
      updatedAt: job.updatedAt!,
    };
  }
}
