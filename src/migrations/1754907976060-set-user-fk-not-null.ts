import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetUserFkNotNull1754907976060 implements MigrationInterface {
  name = 'SetUserFkNotNull1754907976060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" DROP CONSTRAINT "FK_d9a69261ec9190d0896250395bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" DROP CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ADD CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER" UNIQUE ("user_id", "type")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ADD CONSTRAINT "FK_d9a69261ec9190d0896250395bc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" DROP CONSTRAINT "FK_d9a69261ec9190d0896250395bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" DROP CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ADD CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER" UNIQUE ("type", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ADD CONSTRAINT "FK_d9a69261ec9190d0896250395bc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
