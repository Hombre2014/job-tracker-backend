import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToJobApplicationsTable1732567227868 implements MigrationInterface {
    name = 'AddStatusToJobApplicationsTable1732567227868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('Job Created', 'Deadline', 'Applied', 'Interview', 'Offer Received', 'Job Moved')`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "status" "public"."job_applications_status_enum" NOT NULL DEFAULT 'Job Created'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum"`);
    }

}
