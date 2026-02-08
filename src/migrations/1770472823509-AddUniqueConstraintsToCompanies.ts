import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintsToCompanies1770472823509 implements MigrationInterface {
    name = 'AddUniqueConstraintsToCompanies1770472823509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_3dacbb3eb4f095e29372ff8e131" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_66977e5f20359829aacb485cd70" UNIQUE ("url")`);
        await queryRunner.query(`CREATE INDEX "idx_company_url" ON "companies" ("url") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_company_url"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_66977e5f20359829aacb485cd70"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_3dacbb3eb4f095e29372ff8e131"`);
    }

}
