import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '../common/decorators';
import { CommentDto, GeneratePosterDto, PageQueryDto } from '../common/dto';
import { Errors } from '../common/errors';
import { AuthUser } from '../common/types';
import { imageUploadOptions } from '../common/upload';
import { ArtworksService } from './artworks.service';

@Controller()
export class ArtworksController {
  constructor(private readonly artworks: ArtworksService) {}

  @Get('teacher/students')
  @Roles(Role.teacher, Role.admin)
  teacherStudents(@CurrentUser() user: AuthUser, @Query() page: PageQueryDto) {
    return this.artworks.listTeacherStudents(user, page);
  }

  @Get('teacher/students/:studentId/artworks')
  @Roles(Role.teacher, Role.admin)
  teacherTimeline(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
    @Query() page: PageQueryDto,
  ) {
    return this.artworks.listArtworks(user, studentId, page);
  }

  @Post('teacher/students/:studentId/artworks')
  @Roles(Role.teacher)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  uploadArtwork(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: { title?: string; createdAt?: string; courseTheme?: string },
  ) {
    if (!file) {
      throw Errors.validation('请上传作品图片');
    }
    return this.artworks.createArtwork({
      teacherId: user.id,
      studentId,
      title: body.title,
      createdAt: body.createdAt,
      courseTheme: body.courseTheme,
      file,
    });
  }

  @Get('teacher/artworks/:artworkId')
  @Roles(Role.teacher, Role.admin)
  teacherArtwork(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
  ) {
    return this.artworks.getArtwork(user, artworkId);
  }

  @Post('teacher/artworks/:artworkId/comments')
  @Roles(Role.teacher)
  comment(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
    @Body() dto: CommentDto,
  ) {
    return this.artworks.comment(user.id, artworkId, dto.text);
  }

  @Get('parent/children')
  @Roles(Role.parent)
  parentChildren(@CurrentUser() user: AuthUser) {
    return this.artworks.listParentChildren(user.id);
  }

  @Get('parent/children/:studentId/artworks')
  @Roles(Role.parent)
  parentArtworks(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
    @Query() page: PageQueryDto,
  ) {
    return this.artworks.listArtworks(user, studentId, page);
  }

  @Get('parent/artworks/:artworkId')
  @Roles(Role.parent)
  parentArtwork(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
  ) {
    return this.artworks.getArtwork(user, artworkId);
  }

  @Post('parent/artworks/:artworkId/posters')
  @Roles(Role.parent)
  parentPoster(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
    @Body() dto: GeneratePosterDto,
  ) {
    return this.artworks.generatePoster(user, artworkId, dto.templateKey);
  }
}
