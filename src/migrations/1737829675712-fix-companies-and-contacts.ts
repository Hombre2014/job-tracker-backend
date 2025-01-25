import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCompaniesAndContacts1737829675712 implements MigrationInterface {
  name = 'FixCompaniesAndContacts1737829675712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_0123b76ca96efa233c78f87d1ec"`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts_companies_companies" ("contactsId" uuid NOT NULL, "companiesId" uuid NOT NULL, CONSTRAINT "PK_215a4a1f288ccd0df6dbceadce5" PRIMARY KEY ("contactsId", "companiesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb531ad5450b6d718538cfebce" ON "contacts_companies_companies" ("contactsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e208316b379b5c3cd168fc878" ON "contacts_companies_companies" ("companiesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "REL_0123b76ca96efa233c78f87d1e"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "job_application_id"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "company_name"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "company_location"`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "FK_4bf4f05ce72bb2a329d87861942"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "UQ_4bf4f05ce72bb2a329d87861942"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_4bf4f05ce72bb2a329d87861942" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts_companies_companies" ADD CONSTRAINT "FK_eb531ad5450b6d718538cfebcec" FOREIGN KEY ("contactsId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts_companies_companies" ADD CONSTRAINT "FK_9e208316b379b5c3cd168fc8780" FOREIGN KEY ("companiesId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contacts_companies_companies" DROP CONSTRAINT "FK_9e208316b379b5c3cd168fc8780"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts_companies_companies" DROP CONSTRAINT "FK_eb531ad5450b6d718538cfebcec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "FK_4bf4f05ce72bb2a329d87861942"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "UQ_4bf4f05ce72bb2a329d87861942" UNIQUE ("company_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_4bf4f05ce72bb2a329d87861942" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "contacts" ADD "company_location" character varying`);
    await queryRunner.query(`ALTER TABLE "contacts" ADD "company_name" character varying`);
    await queryRunner.query(`ALTER TABLE "companies" ADD "job_application_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "REL_0123b76ca96efa233c78f87d1e" UNIQUE ("job_application_id")`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9e208316b379b5c3cd168fc878"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eb531ad5450b6d718538cfebce"`);
    await queryRunner.query(`DROP TABLE "contacts_companies_companies"`);
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_0123b76ca96efa233c78f87d1ec" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
