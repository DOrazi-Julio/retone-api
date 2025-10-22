import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateHumanizationJobsTable1780000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'humanization_jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'varchar',
          },
          {
            name: 'inputFileUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'outputFileUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tokensUsed',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'readability',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('humanization_jobs');
  }
}
