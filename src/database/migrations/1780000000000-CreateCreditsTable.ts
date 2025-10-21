import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCreditsTable1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'credits',
        columns: [
          {
            name: 'userId',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'balance',
            type: 'int',
            default: 0,
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
    await queryRunner.dropTable('credits');
  }
}
