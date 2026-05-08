import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1778118793326 implements MigrationInterface {
  name = 'Migration1778118793326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "gold_buys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "buyDate" date NOT NULL, "chiAmount" numeric(10,4) NOT NULL, "amountVnd" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_22747398783d5a4104936722bcd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "gold_buys" ADD CONSTRAINT "FK_8d4f38418410900b961117c16cd" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gold_buys" DROP CONSTRAINT "FK_8d4f38418410900b961117c16cd"`,
    );
    await queryRunner.query(`DROP TABLE "gold_buys"`);
  }
}
