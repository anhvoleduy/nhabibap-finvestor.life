import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1778055271518 implements MigrationInterface {
  name = 'Migration1778055271518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "board_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "boardId" uuid NOT NULL, "userId" uuid NOT NULL, "role" character varying NOT NULL, CONSTRAINT "UQ_345cd31bb32ae01f9fbc5ac3a1c" UNIQUE ("boardId", "userId"), CONSTRAINT "PK_6994cea1393b5fa3a0dd827a9f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "entryDate" date NOT NULL, "currentValue" bigint NOT NULL, "notes" character varying, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_67628f064e719a0811390925054" UNIQUE ("assetId", "entryDate"), CONSTRAINT "PK_0e596e24e7a7ac130dcc253e708" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "name" character varying NOT NULL, "capital" bigint NOT NULL DEFAULT '0', "metadata" jsonb, CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "boardId" uuid NOT NULL, "type" character varying NOT NULL, CONSTRAINT "UQ_2a812139c680f0879ceaa9c25d0" UNIQUE ("boardId", "type"), CONSTRAINT "PK_d21442187e7b0237566389805a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cash_flow_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "boardId" uuid NOT NULL, "entryDate" date NOT NULL, "label" character varying NOT NULL, "amount" bigint NOT NULL, "flowType" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_269d757cae13ba2578b25e2e4c7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "boards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_606923b0b068ef262dfdcd18f44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "nav_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "boardId" uuid NOT NULL, "snapshotDate" date NOT NULL, "totalCapital" bigint NOT NULL, "totalValue" bigint NOT NULL, CONSTRAINT "UQ_3944e495b865cfb044281470dac" UNIQUE ("boardId", "snapshotDate"), CONSTRAINT "PK_11c658e4277439b15b18d7b67bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" ADD CONSTRAINT "FK_8dfe924ec592792320086ebb692" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" ADD CONSTRAINT "FK_2af5912734e7fbedc23afd07adc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_entries" ADD CONSTRAINT "FK_b8080a755bc59d99f73417f53cf" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_entries" ADD CONSTRAINT "FK_397973b0f466160e2dffcfe042a" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_2e847f9d0120b4ca0d7269dda0e" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_categories" ADD CONSTRAINT "FK_4656b473681c264c7c60c8b7c94" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "FK_60d3b7b0f47dd230ef00ad5e5cc" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_dcdf669d9c6727190556702de56" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nav_snapshots" ADD CONSTRAINT "FK_20d8e3bbca0779c856e6661f991" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "nav_snapshots" DROP CONSTRAINT "FK_20d8e3bbca0779c856e6661f991"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "FK_dcdf669d9c6727190556702de56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_flow_entries" DROP CONSTRAINT "FK_60d3b7b0f47dd230ef00ad5e5cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_categories" DROP CONSTRAINT "FK_4656b473681c264c7c60c8b7c94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" DROP CONSTRAINT "FK_2e847f9d0120b4ca0d7269dda0e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_entries" DROP CONSTRAINT "FK_397973b0f466160e2dffcfe042a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_entries" DROP CONSTRAINT "FK_b8080a755bc59d99f73417f53cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" DROP CONSTRAINT "FK_2af5912734e7fbedc23afd07adc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" DROP CONSTRAINT "FK_8dfe924ec592792320086ebb692"`,
    );
    await queryRunner.query(`DROP TABLE "nav_snapshots"`);
    await queryRunner.query(`DROP TABLE "boards"`);
    await queryRunner.query(`DROP TABLE "cash_flow_entries"`);
    await queryRunner.query(`DROP TABLE "asset_categories"`);
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP TABLE "asset_entries"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "board_members"`);
  }
}
