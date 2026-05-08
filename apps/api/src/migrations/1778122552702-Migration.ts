import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1778122552702 implements MigrationInterface {
  name = 'Migration1778122552702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "crypto_buys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "buyDate" date NOT NULL, "amountVnd" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_98104659382196de924196c61c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "crypto_buys" ADD CONSTRAINT "FK_4864ed36d913f7a16073cf7d802" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "crypto_buys" DROP CONSTRAINT "FK_4864ed36d913f7a16073cf7d802"`,
    );
    await queryRunner.query(`DROP TABLE "crypto_buys"`);
  }
}
