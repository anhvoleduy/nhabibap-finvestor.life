import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardWallet1778200000000 implements MigrationInterface {
  name = 'AddBoardWallet1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boards" ADD "bankBalance" bigint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" ADD "cashBalance" bigint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "cashBalance"`);
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "bankBalance"`);
  }
}
