import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatusUpdatedAtColumnInJobApplicationsTable1730227669949
  implements MigrationInterface
{
  name = 'CreateStatusUpdatedAtColumnInJobApplicationsTable1730227669949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "status_changed_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "status_changed_at"`);
  }
}
