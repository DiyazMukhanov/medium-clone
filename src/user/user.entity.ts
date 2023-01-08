import {BeforeInsert, Column, Entity, PrimaryGeneratedColumn} from "typeorm";
// import {hash} from 'bcrypt';
const bcrypt = require('bcrypt');

@Entity({name: 'users'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column({ default: '' })
    bio: string;

    @Column({ default: '' } )
    image: string;

    @Column()
    password: string;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }
}


