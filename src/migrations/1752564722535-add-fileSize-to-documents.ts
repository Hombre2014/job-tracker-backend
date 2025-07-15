import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileSizeToDocuments1752564722535 implements MigrationInterface {
  name = 'AddFileSizeToDocuments1752564722535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ADD "fileSize" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "fileSize"`);
  }
}
