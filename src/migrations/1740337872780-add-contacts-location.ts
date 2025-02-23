import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactsLocation1740337872780 implements MigrationInterface {
  name = 'AddContactsLocation1740337872780';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" ADD "location" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "location"`);
  }
}
