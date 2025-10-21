import { Controller, Post, Body } from '@nestjs/common';
import { CreateHumanizationJobDto } from './dto/create-humanization-job.dto';
import { HumanizationJobDto } from './dto/humanization-job.dto';
import { HumanizationJobsService } from './humanization-jobs.service';

@Controller('humanization-jobs')
export class HumanizationJobsController {
  constructor(private readonly service: HumanizationJobsService) {}

  @Post()
  async createJob(@Body() dto: CreateHumanizationJobDto): Promise<HumanizationJobDto> {
    return this.service.createJob(dto);
  }
}
