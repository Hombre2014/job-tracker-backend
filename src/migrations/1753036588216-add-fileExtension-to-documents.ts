import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileExtensionToDocuments1753036588216 implements MigrationInterface {
  name = 'AddFileExtensionToDocuments1753036588216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('documents');
    const columnExists = table.findColumnByName('fileExtension');

    if (!columnExists) {
      await queryRunner.query(`ALTER TABLE "documents" ADD "fileExtension" character varying`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before dropping
    const table = await queryRunner.getTable('documents');
    const columnExists = table.findColumnByName('fileExtension');

    if (columnExists) {
      await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "fileExtension"`);
    }
  }
}
