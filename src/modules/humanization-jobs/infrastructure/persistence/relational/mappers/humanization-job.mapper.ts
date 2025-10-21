import { HumanizationJobEntity } from '../entities/humanization-job.entity';
import { HumanizationJob } from '../../../../domain/humanization-job';

export class HumanizationJobMapper {
  static toDomain(entity: HumanizationJobEntity): HumanizationJob {
    return new HumanizationJob(
      entity.id,
      entity.userId,
      entity.inputText,
      entity.inputFileUrl,
      entity.outputFileUrl,
      entity.tokensUsed,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(domain: HumanizationJob): HumanizationJobEntity {
    const entity = new HumanizationJobEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.inputText = domain.inputText;
    entity.inputFileUrl = domain.inputFileUrl;
    entity.outputFileUrl = domain.outputFileUrl;
    entity.tokensUsed = domain.tokensUsed;
    entity.status = domain.status;
  if (domain.createdAt) entity.createdAt = domain.createdAt;
  if (domain.updatedAt) entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
