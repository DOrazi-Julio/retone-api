import { HumanizationJobStatus } from '../domain/humanization-job';

export class HumanizationJobDto {
  id: string;
  userId: string;
  inputFileUrl?: string;
  outputFileUrl?: string;
  tokensUsed?: number;
  status: HumanizationJobStatus;
  createdAt: Date;
  updatedAt: Date;
}
