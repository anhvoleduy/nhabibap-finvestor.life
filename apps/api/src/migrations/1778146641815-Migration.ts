import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1778146641815 implements MigrationInterface {
  name = 'Migration1778146641815';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_8dfe924ec592792320086ebb69" ON "board_members" ("boardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2af5912734e7fbedc23afd07ad" ON "board_members" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8080a755bc59d99f73417f53c" ON "asset_entries" ("assetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_397973b0f466160e2dffcfe042" ON "asset_entries" ("createdById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e847f9d0120b4ca0d7269dda0" ON "assets" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4656b473681c264c7c60c8b7c9" ON "asset_categories" ("boardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60d3b7b0f47dd230ef00ad5e5c" ON "cash_flow_entries" ("boardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20d8e3bbca0779c856e6661f99" ON "nav_snapshots" ("boardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d4f38418410900b961117c16c" ON "gold_buys" ("assetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4864ed36d913f7a16073cf7d80" ON "crypto_buys" ("assetId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4864ed36d913f7a16073cf7d80"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8d4f38418410900b961117c16c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20d8e3bbca0779c856e6661f99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_60d3b7b0f47dd230ef00ad5e5c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4656b473681c264c7c60c8b7c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e847f9d0120b4ca0d7269dda0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_397973b0f466160e2dffcfe042"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8080a755bc59d99f73417f53c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2af5912734e7fbedc23afd07ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8dfe924ec592792320086ebb69"`,
    );
  }
}
