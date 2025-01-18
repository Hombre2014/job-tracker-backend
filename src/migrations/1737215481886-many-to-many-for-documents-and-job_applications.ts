import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManyToManyForDocumentsAndJobApplications1737215481886 implements MigrationInterface {
  name = 'ManyToManyForDocumentsAndJobApplications1737215481886';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "documents_job_applications_job_applications" ("documentsId" uuid NOT NULL, "jobApplicationsId" uuid NOT NULL, CONSTRAINT "PK_3ca4da0e9b2872887e017753c1d" PRIMARY KEY ("documentsId", "jobApplicationsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_328692dea1346002ec2d992888" ON "documents_job_applications_job_applications" ("documentsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e8e987050f8a5bb0c4beb32a8" ON "documents_job_applications_job_applications" ("jobApplicationsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "documents_job_applications_job_applications" ADD CONSTRAINT "FK_328692dea1346002ec2d9928888" FOREIGN KEY ("documentsId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents_job_applications_job_applications" ADD CONSTRAINT "FK_0e8e987050f8a5bb0c4beb32a80" FOREIGN KEY ("jobApplicationsId") REFERENCES "job_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents_job_applications_job_applications" DROP CONSTRAINT "FK_0e8e987050f8a5bb0c4beb32a80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents_job_applications_job_applications" DROP CONSTRAINT "FK_328692dea1346002ec2d9928888"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_0e8e987050f8a5bb0c4beb32a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_328692dea1346002ec2d992888"`);
    await queryRunner.query(`DROP TABLE "documents_job_applications_job_applications"`);
  }
}
