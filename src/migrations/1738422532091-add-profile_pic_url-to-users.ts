import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePicUrlToUsers1738422532091 implements MigrationInterface {
  name = 'AddProfilePicUrlToUsers1738422532091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "profile_pic_url" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_pic_url"`);
  }
}
