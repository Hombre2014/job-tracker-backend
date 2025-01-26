import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeJobTitleNullable1737908682540 implements MigrationInterface {
  name = 'MakeJobTitleNullable1737908682540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "job_title" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "job_title" SET NOT NULL`);
  }
}
