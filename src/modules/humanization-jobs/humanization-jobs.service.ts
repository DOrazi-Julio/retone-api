import { Injectable, Inject, BadRequestException } from '@nestjs/common';
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
import { HumanizationJobStatus } from './domain/humanization-job';

const HUMANIZATION_CREDIT_COST = 1;

@Injectable()
export class HumanizationJobsService {
  constructor(
    private readonly jobRepo: HumanizationJobRepository,
    private readonly creditsService: CreditsService,
    private readonly filesService: FilesService,
    @InjectQueue(HUMANIZATION_JOBS_QUEUE) private readonly queue: Queue,
  ) {}

  async createJob(dto: CreateHumanizationJobDto): Promise<HumanizationJobDto> {
    // 1. Check credits
    const hasCredits = await this.creditsService.hasSufficientCredits(
      dto.userId,
      HUMANIZATION_CREDIT_COST,
    );
    if (!hasCredits) throw new BadRequestException('Insufficient credits');
    await this.creditsService.deductCredits(
      dto.userId,
      HUMANIZATION_CREDIT_COST,
    );

    // 2. Create job record
    const jobId = uuidv4();
    const inputFileId = await this.filesService.uploadTextFile(
      `jobs/${jobId}/input.txt`,
      dto.inputText,
    );
    const jobEntity = await this.jobRepo.create({
      id: jobId,
      userId: dto.userId,
      inputFileUrl: inputFileId,
      status: HumanizationJobStatus.PENDING,
      readability: dto.readability,
      tone: dto.tone,
    });
    const job = HumanizationJobMapper.toDomain(jobEntity);

    // 3. Enqueue job
    await this.queue.add('process', {
      jobId,
      readability: dto.readability,
      tone: dto.tone,
    });

    // 4. Return DTO
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
