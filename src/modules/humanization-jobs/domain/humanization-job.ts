export type HumanizationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export class HumanizationJob {
  constructor(
    public id: string,
    public userId: string,
    public inputFileUrl?: string,
    public outputFileUrl?: string,
    public tokensUsed?: number,
    public status: HumanizationJobStatus = 'pending',
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
