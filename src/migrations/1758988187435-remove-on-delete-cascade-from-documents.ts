import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOnDeleteCascadeFromDocuments1758988187435 implements MigrationInterface {
  name = 'RemoveOnDeleteCascadeFromDocuments1758988187435';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_c7481daf5059307842edef74d73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_c7481daf5059307842edef74d73" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_c7481daf5059307842edef74d73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_c7481daf5059307842edef74d73" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
