import { Process, Processor } from '@nestjs/bull';
import { HUMANIZATION_JOBS_QUEUE } from './queue';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { HumanizationJobRepository } from './infrastructure/persistence/relational/repositories/humanization-job.repository';
import { FilesService } from '../../files/files.service';
import { OpenAI } from 'openai';
import { HumanizationJobStatus } from './domain/humanization-job';

@Injectable()
@Processor(HUMANIZATION_JOBS_QUEUE)
export class HumanizationJobsProcessor {
  private readonly logger = new Logger(HumanizationJobsProcessor.name);

  constructor(
    private readonly jobRepo: HumanizationJobRepository,
    private readonly filesService: FilesService,
  ) {}

  @Process('process')
  async handleProcess(
    job: Job<{ jobId: string; readability?: string; tone?: string }>,
  ) {
    const { jobId, readability, tone } = job.data;
    this.logger.log(`Starting job ${jobId} with readability=${readability} tone=${tone}`);

    const jobEntity = await this.jobRepo.findById(jobId);
    if (!jobEntity) {
      this.logger.warn(`Job ${jobId} not found`);
      return;
    }

    try {
  await this.jobRepo.update(jobId, { status: HumanizationJobStatus.PROCESSING });
  this.logger.log(`Job ${jobId} marked as ${HumanizationJobStatus.PROCESSING}`);

      // Download input text
      const inputText = await this.filesService.downloadFileAsText(
        jobEntity.inputFileUrl ?? '',
      );
      this.logger.log(`Downloaded input for job ${jobId} (${inputText.length} chars)`);

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      let systemPrompt = 'Humanize the following text.';
      if (readability) systemPrompt += ` Make it suitable for ${readability} readability level.`;
      if (tone) systemPrompt += ` Use a ${tone} tone.`;

      const response = await openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText },
        ],
      });

      const outputText = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      this.logger.log(`OpenAI completed for job ${jobId} (tokens used: ${tokensUsed})`);

      // Upload output
      const outputFileUrl = await this.filesService.uploadTextFile(
        `jobs/${jobId}/output.txt`,
        outputText ?? '',
      );
      this.logger.log(`Uploaded output for job ${jobId} to ${outputFileUrl}`);

      // Update job
      await this.jobRepo.update(jobId, {
        status: HumanizationJobStatus.COMPLETED,
        outputFileUrl,
        tokensUsed,
      });
      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (err) {
  await this.jobRepo.update(jobId, { status: HumanizationJobStatus.FAILED });
  this.logger.error(`Job ${jobId} failed`, err as any);
    }
  }
}
