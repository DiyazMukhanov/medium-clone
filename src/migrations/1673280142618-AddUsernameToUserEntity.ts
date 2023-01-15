import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameToUserEntity1673280142618 implements MigrationInterface {
    name = 'AddUsernameToUserEntity1673280142618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
