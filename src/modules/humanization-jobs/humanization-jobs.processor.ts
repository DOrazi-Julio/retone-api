import { Process, Processor } from '@nestjs/bull';
import { HUMANIZATION_JOBS_QUEUE } from './queue';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { HumanizationJobRepository } from './infrastructure/persistence/relational/repositories/humanization-job.repository';
import { FilesService } from '../../files/files.service';
import { OpenAI } from 'openai';

@Injectable()
@Processor(HUMANIZATION_JOBS_QUEUE)
export class HumanizationJobsProcessor {
  constructor(
    private readonly jobRepo: HumanizationJobRepository,
    private readonly filesService: FilesService,
  ) {}

  @Process('process')
  async handleProcess(job: Job<{ jobId: string }>) {
    const { jobId } = job.data;
    const jobEntity = await this.jobRepo.findById(jobId);
    if (!jobEntity) return;
    try {
      await this.jobRepo.update(jobId, { status: 'processing' });
      // Download input text
  const inputText = await this.filesService.downloadFileAsText(jobEntity.inputFileUrl ?? '');
      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Humanize the following text.' },
          { role: 'user', content: inputText },
        ],
      });
      const outputText = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      // Upload output
  const outputFileUrl = await this.filesService.uploadTextFile(`jobs/${jobId}/output.txt`, outputText ?? '');
      // Update job
      await this.jobRepo.update(jobId, {
        status: 'completed',
        outputFileUrl,
        tokensUsed,
      });
    } catch (err) {
      await this.jobRepo.update(jobId, { status: 'failed' });
    }
  }
}
