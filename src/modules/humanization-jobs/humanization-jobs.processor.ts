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
  async handleProcess(job: Job<{ jobId: string; readability?: string; tone?: string }>) {
    const { jobId, readability, tone } = job.data;
    const jobEntity = await this.jobRepo.findById(jobId);
    if (!jobEntity) return;
    try {
      await this.jobRepo.update(jobId, { status: 'processing' });
      // Download input text
  const inputText = await this.filesService.downloadFileAsText(jobEntity.inputFileUrl ?? '');
      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      let systemPrompt = 'Humanize the following text.';
      if (readability) {
        systemPrompt += ` Make it suitable for ${readability} readability level.`;
      }
      if (tone) {
        systemPrompt += ` Use a ${tone} tone.`;
      }
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
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
