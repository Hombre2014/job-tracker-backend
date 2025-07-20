import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileExtensionToDocuments1753036588216 implements MigrationInterface {
    name = 'AddFileExtensionToDocuments1753036588216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "fileExtension" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "fileExtension"`);
    }

}
