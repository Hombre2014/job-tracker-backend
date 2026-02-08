import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogoToCompanies1770493336331 implements MigrationInterface {
    name = 'AddLogoToCompanies1770493336331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo"`);
    }

}
