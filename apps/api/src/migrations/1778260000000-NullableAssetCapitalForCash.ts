import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullableAssetCapitalForCash1778260000000
  implements MigrationInterface
{
  name = 'NullableAssetCapitalForCash1778260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assets" ALTER COLUMN "capital" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "assets" SET "capital" = 0 WHERE "capital" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ALTER COLUMN "capital" SET NOT NULL`,
    );
  }
}
