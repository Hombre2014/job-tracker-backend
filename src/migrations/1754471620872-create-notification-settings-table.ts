import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationSettingsTable1754471620872 implements MigrationInterface {
  name = 'CreateNotificationSettingsTable1754471620872';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_settings_day_of_week_enum" AS ENUM('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('DAILY', 'WEEKLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "time" character varying(5) NOT NULL, "day_of_week" "public"."notification_settings_day_of_week_enum", "type" "public"."notification_settings_type_enum" NOT NULL, "user_id" uuid, CONSTRAINT "UN_NOTIFICATION_TYPE_PER_USER" UNIQUE ("user_id", "type"), CONSTRAINT "CHK_dfa727e26d669eadc43e478dae" CHECK ("time" ~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'), CONSTRAINT "CHK_7c092f362fc62e335bb90c2a74" CHECK (("type" != 'WEEKLY') OR ("day_of_week" IS NOT NULL)), CONSTRAINT "PK_d131abd7996c475ef768d4559ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_settings" ADD CONSTRAINT "FK_91a7ffebe8b406c4470845d4781" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_settings" DROP CONSTRAINT "FK_91a7ffebe8b406c4470845d4781"`,
    );
    await queryRunner.query(`DROP TABLE "notification_settings"`);
    await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_settings_day_of_week_enum"`);
  }
}
