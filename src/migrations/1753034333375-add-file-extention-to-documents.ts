import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileExtentionToDocuments1753034333375 implements MigrationInterface {
  name = 'AddFileExtentionToDocuments1753034333375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ADD "fileExtension" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "fileExtension"`);
  }
}
