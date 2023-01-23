import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ArticleService } from '@app/article/article.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { User } from '@app/user/decorators/user.decorator';
import { ArticleResponseInterface } from '@app/article/types/articleResponse.interface';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';
import {ArticlesResponseInterface} from "@app/article/types/articlesResponse.interface";

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async findAll(
    @User('id') currentUserId: number,
    @Query() query: any,
  ): Promise<ArticlesResponseInterface> {
    return await this.articleService.findAll(currentUserId, query);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async create(
    @User() currentUser: UserEntity,
    @Body('article') createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(
      currentUser,
      createArticleDto,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Get(':slug')
  async getArticle(
    @Param('slug') slug: string,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.getArticle(slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteArticle(
    @Param('slug') slug: string,
    @User('id') currentUserId: number,
  ) {
    return await this.articleService.deleteArticle(slug, currentUserId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  async updateArticle(
    @Param('slug') slug: string,
    @User('id') currentUserId: number,
    @Body('article') updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.updateArticle(
      slug,
      currentUserId,
      updateArticleDto,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/favorites')
  @UseGuards(AuthGuard)
  async addArticleToFavorites(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.addArticleTofavorites(slug, currentUserId);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug/favorites')
  @UseGuards(AuthGuard)
  async deleteArticleFromFavorites(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.deleteArticleFromfavorites(slug, currentUserId);
    return this.articleService.buildArticleResponse(article);
  }
}
