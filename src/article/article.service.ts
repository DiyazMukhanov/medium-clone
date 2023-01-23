import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {UserEntity} from "@app/user/user.entity";
import {CreateArticleDto} from "@app/article/dto/createArticle.dto";
import {ArticleEntity} from "@app/article/article.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DataSource, DeleteResult, Repository} from "typeorm";
import {ArticleResponseInterface} from "@app/article/types/articleResponse.interface";
import slugify from 'slugify';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';
import {ArticlesResponseInterface} from "@app/article/types/articlesResponse.interface";

@Injectable()
export class ArticleService{
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private dataSource: DataSource
    ) {}

    async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const queryBuilder = this.dataSource.getRepository(ArticleEntity).createQueryBuilder(
            'articles').leftJoinAndSelect('articles.author', 'author');

        queryBuilder.orderBy('articles.createdAt', 'DESC');
        const articlesCount = await queryBuilder.getCount();

        if(query.tag) {
            queryBuilder.andWhere('articles.tagList LIKE :tag', {
               tag: `%${query.tag}%`
            });
        }

        if(query.author) {
            const author = await this.userRepository.findOne({
                where: { username: query.author}
            });
            queryBuilder.andWhere('articles.authorId = :id', {
                id: author.id
            })
        }

        if(query.favorited) {
            const user = await this.userRepository.findOne({
                where: { username: query.favorited},
                relations: ['favorites']
            });

            const ids = user.favorites.map(el => el.id);
            if(ids.length > 0) {
                queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
            } else {
                queryBuilder.andWhere('1=0'); //just to stop querybuilder
            }

        }

        if(query.limit) {
            queryBuilder.limit(query.limit);
        }

        if(query.offset) {
            queryBuilder.offset(query.offset);
        }

        let favoritesId: number[] = [];
        if(currentUserId) {
            const currentUser = await this.userRepository.findOne( {
                where: { id: currentUserId },
                relations: ['favorites']
            });
            favoritesId = currentUser.favorites.map(favorite => favorite.id);
        }


        //http://localhost:3000/articles?limit=2&offset=0

        const articles = await queryBuilder.getMany();
        const articlesWithfavorites = articles.map(article => {
            const favorited = favoritesId.includes(article.id);
            return {...article, favorited};
        })


        return {articles: articlesWithfavorites, articlesCount};
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

        if(article.author.id !== currentUserId) {
            throw new HttpException('The user is not author', HttpStatus.FORBIDDEN);
        }

        return await this.articleRepository.delete({ slug });
    }

    async updateArticle(slug: string, currentUserId: number, updateArticleDto: UpdateArticleDto): Promise<ArticleEntity> {
        const article = await this.getArticle(slug);
        if(!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
        }

        if(article.author.id !== currentUserId) {
            throw new HttpException('The user is not author', HttpStatus.FORBIDDEN);
        }

        if(updateArticleDto.title) {
            article.slug = this.getSlug(updateArticleDto.title);
        }

        Object.assign(article, updateArticleDto);

        return await this.articleRepository.save(article);
    }

    async addArticleTofavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
        const article = await this.getArticle(slug)
        const user = await this.userRepository.findOne({
            where: { id: currentUserId },
            relations: ['favorites']
        })

        const isNotFavorited = user.favorites.findIndex(articleInFavorites => articleInFavorites.id === article.id) === -1;

        if(isNotFavorited) {
            user.favorites.push(article);
            article.favoritesCount++;
            await this.userRepository.save(user);
            await this.articleRepository.save(article);
        }
        return article;
        // user.favorites.push(article)
    }

    async deleteArticleFromfavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
        const article = await this.getArticle(slug)
        const user = await this.userRepository.findOne({
            where: { id: currentUserId },
            relations: ['favorites']
        })

        const articleIndex = user.favorites.findIndex(articleInFavorites => articleInFavorites.id === article.id);
        if(articleIndex >= 0) {
           user.favorites.splice(articleIndex, 1); //mutable method
            article.favoritesCount--;
            await this.userRepository.save(user);
            await this.articleRepository.save(article);
        }
        return article;
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