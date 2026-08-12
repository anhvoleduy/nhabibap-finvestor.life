import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnverifiedUserCleanup1786598400000
  implements MigrationInterface
{
  name = 'AddUnverifiedUserCleanup1786598400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "unverifiedWarningEmailSentAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "unverifiedWarningEmailSentAt"`,
    );
  }
}
