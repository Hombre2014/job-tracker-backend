import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexForNotificationSchedulesTable1754907468943 implements MigrationInterface {
  name = 'AddIndexForNotificationSchedulesTable1754907468943';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_NOTIFICATION_SCHEDULE_SCHEDULED_TIME" ON "notification_schedules" ("scheduled_time") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_NOTIFICATION_SCHEDULE_SCHEDULED_TIME"`);
  }
}
