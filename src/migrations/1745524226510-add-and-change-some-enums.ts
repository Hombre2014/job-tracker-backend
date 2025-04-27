import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAndChangeSomeEnums1745524226510 implements MigrationInterface {
    name = 'AddAndChangeSomeEnums1745524226510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_code_verifications_process_enum" RENAME TO "user_code_verifications_process_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_code_verifications_process_enum" AS ENUM('USER_SIGNUP', 'USER_EMAIL_RESET', 'USER_DELETE', 'USER_RESET_PASSWORD')`);
        await queryRunner.query(`ALTER TABLE "user_code_verifications" ALTER COLUMN "process" TYPE "public"."user_code_verifications_process_enum" USING "process"::"text"::"public"."user_code_verifications_process_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_code_verifications_process_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_code_verifications_process_enum_old" AS ENUM('USER_SIGNUP', 'USER_DELETE', 'USER_RESET_PASSWORD')`);
        await queryRunner.query(`ALTER TABLE "user_code_verifications" ALTER COLUMN "process" TYPE "public"."user_code_verifications_process_enum_old" USING "process"::"text"::"public"."user_code_verifications_process_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_code_verifications_process_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_code_verifications_process_enum_old" RENAME TO "user_code_verifications_process_enum"`);
    }

}
