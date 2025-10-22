import { HumanizationJobEntity } from '../entities/humanization-job.entity';
import { HumanizationJob } from '../../../../domain/humanization-job';

export class HumanizationJobMapper {
  static toDomain(entity: HumanizationJobEntity): HumanizationJob {
    return new HumanizationJob(
      entity.id,
      entity.userId,
      entity.inputFileUrl,
      entity.outputFileUrl,
      entity.tokensUsed,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
      entity.readability,
      entity.tone,
    );
  }

  static toEntity(domain: HumanizationJob): HumanizationJobEntity {
    const entity = new HumanizationJobEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.inputFileUrl = domain.inputFileUrl;
    entity.outputFileUrl = domain.outputFileUrl;
    entity.tokensUsed = domain.tokensUsed;
    entity.status = domain.status;
    entity.readability = domain.readability;
    entity.tone = domain.tone;
    return entity;
  }
}
