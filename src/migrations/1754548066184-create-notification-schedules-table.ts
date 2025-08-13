import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationSchedulesTable1754548066184 implements MigrationInterface {
  name = 'CreateNotificationSchedulesTable1754548066184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_schedules_day_of_week_enum" AS ENUM('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_schedules_type_enum" AS ENUM('DAILY', 'WEEKLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "time" character varying(5) NOT NULL, "timezone_offset" integer NOT NULL, "day_of_week" "public"."notification_schedules_day_of_week_enum", "type" "public"."notification_schedules_type_enum" NOT NULL, "scheduled_time" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER" UNIQUE ("user_id", "type"), CONSTRAINT "CHK_2dede27a571bcd7f185a50a98d" CHECK ("timezone_offset" >= -840 AND "timezone_offset" <= 720), CONSTRAINT "CHK_9828724d53d539da0731d4d9e2" CHECK ("time" ~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'), CONSTRAINT "CHK_2b61f299aa447467c616335e6b" CHECK (("type" != 'WEEKLY') OR ("day_of_week" IS NOT NULL)), CONSTRAINT "PK_a23b6b82168c2cc95d3499cf6a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" ADD CONSTRAINT "FK_d9a69261ec9190d0896250395bc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_schedules" DROP CONSTRAINT "FK_d9a69261ec9190d0896250395bc"`,
    );
    await queryRunner.query(`DROP TABLE "notification_schedules"`);
    await queryRunner.query(`DROP TYPE "public"."notification_schedules_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_schedules_day_of_week_enum"`);
  }
}
