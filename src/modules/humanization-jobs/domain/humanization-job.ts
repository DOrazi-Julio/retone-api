export enum HumanizationJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class HumanizationJob {
  constructor(
    public id: string,
    public userId: string,
    public inputFileUrl?: string,
    public outputFileUrl?: string,
    public tokensUsed?: number,
    public status: HumanizationJobStatus = HumanizationJobStatus.PENDING,
    public createdAt?: Date,
    public updatedAt?: Date,
    public readability?: string,
    public tone?: string,
  ) {}
}
