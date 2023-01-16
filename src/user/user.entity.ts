import {BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ArticleEntity} from "@app/article/article.entity";
// import {hash} from 'bcrypt';
const bcrypt = require('bcrypt');

@Entity({name: 'users'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column({ default: '' })
    bio: string;

    @Column({ default: '' } )
    image: string;

    @Column({select: false})
    password: string;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    @OneToMany(() => ArticleEntity, article => article.author)
    articles: ArticleEntity[];
}


