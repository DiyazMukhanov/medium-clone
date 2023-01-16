import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {UserEntity} from "@app/user/user.entity";
import {CreateArticleDto} from "@app/article/dto/createArticle.dto";
import {ArticleEntity} from "@app/article/article.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DeleteResult, Repository} from "typeorm";
import {ArticleResponseInterface} from "@app/article/types/articleResponse.interface";
import slugify from 'slugify';

@Injectable()
export class ArticleService{
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>
    ) {
    }
    async createArticle(currentUser: UserEntity, createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = new ArticleEntity() //by this we are creating an empty object
        Object.assign(article, createArticleDto);

        if(!article.tagList) {
            article.tagList = [];
        }

        article.slug = this.getSlug(createArticleDto.title);

        article.author = currentUser; //this code will show typeorm to create a relationship and will save an id of user
        return await this.articleRepository.save(article);
    }

    async getArticle(slug: string): Promise<ArticleEntity> {
        return await this.articleRepository.findOne({
            where: {
                slug
            }
        })
    }

    async deleteArticle(slug: string, currentUserId: number): Promise<DeleteResult> {
        const article = await this.getArticle(slug);
        if(!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
        }
        console.log(article)

        if(article.author.id !== currentUserId) {
            throw new HttpException('The user is not author', HttpStatus.FORBIDDEN);
        }

        return await this.articleRepository.delete({ slug });
    }

    buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
        return {
            article: article
        }
    }

    private getSlug(title: string): string {
        return (
            slugify(title, { lower: true }) + '-' + ((Math.random() * Math.pow(36,6)) | 0).toString(36) //getting unique string
    )
    }
}