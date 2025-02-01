import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoUrlToContacts1738398088155 implements MigrationInterface {
  name = 'AddPhotoUrlToContacts1738398088155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" ADD "photo_url" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "photo_url"`);
  }
}
