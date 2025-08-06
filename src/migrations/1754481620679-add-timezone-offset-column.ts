import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimezoneOffsetColumn1754481620679 implements MigrationInterface {
  name = 'AddTimezoneOffsetColumn1754481620679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_settings" ADD "timezone_offset" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_settings" ADD CONSTRAINT "CHK_40560366e6994201ca1a851304" CHECK ("timezone_offset" >= -840 AND "timezone_offset" <= 720)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_settings" DROP CONSTRAINT "CHK_40560366e6994201ca1a851304"`,
    );
    await queryRunner.query(`ALTER TABLE "notification_settings" DROP COLUMN "timezone_offset"`);
  }
}
