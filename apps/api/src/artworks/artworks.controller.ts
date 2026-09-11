import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser, Roles } from '../common/decorators';
import { CommentDto, GeneratePosterDto } from '../common/dto';
import { AuthUser } from '../common/types';
import { ArtworksService } from './artworks.service';

@Controller()
export class ArtworksController {
  constructor(private readonly artworks: ArtworksService) {}

  @Get('teacher/students')
  @Roles(Role.teacher, Role.admin)
  teacherStudents(@CurrentUser() user: AuthUser) {
    if (user.role === Role.admin) {
      return this.artworks.listAllStudents();
    }
    return this.artworks.listTeacherStudents(user.id);
  }

  @Get('teacher/students/:studentId')
  @Roles(Role.teacher, Role.admin)
  teacherStudent(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.artworks.getStudentFor(user, studentId);
  }

  @Get('teacher/students/:studentId/artworks')
  @Roles(Role.teacher, Role.admin)
  teacherTimeline(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.artworks.timeline(user, studentId);
  }

  @Post('teacher/students/:studentId/artworks')
  @Roles(Role.teacher)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  uploadArtwork(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: { theme?: string; createdOn?: string; textComment?: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传作品图片');
    }
    if (!body.theme || !body.createdOn) {
      throw new BadRequestException('主题与创作时间必填');
    }
    return this.artworks.createArtwork({
      teacherId: user.id,
      studentId,
      theme: body.theme,
      createdOn: body.createdOn,
      textComment: body.textComment,
      file,
    });
  }

  @Post('teacher/artworks/:artworkId/comment')
  @Roles(Role.teacher)
  comment(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
    @Body() dto: CommentDto,
  ) {
    return this.artworks.comment(user.id, artworkId, dto);
  }

  @Get('parent/children')
  @Roles(Role.parent)
  parentChildren(@CurrentUser() user: AuthUser) {
    return this.artworks.listParentChildren(user.id);
  }

  @Get('parent/children/:studentId')
  @Roles(Role.parent)
  parentChild(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.artworks.getStudentFor(user, studentId);
  }

  @Get('parent/children/:studentId/timeline')
  @Roles(Role.parent)
  parentTimeline(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.artworks.timeline(user, studentId);
  }

  @Get('parent/artworks/:artworkId')
  @Roles(Role.parent)
  parentArtwork(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
  ) {
    return this.artworks.getArtwork(user, artworkId);
  }

  @Post('teacher/artworks/:artworkId/posters')
  @Roles(Role.teacher, Role.admin)
  teacherPoster(
    @CurrentUser() user: AuthUser,
    @Param('artworkId') artworkId: string,
    @Body() dto: GeneratePosterDto,
  ) {
    return this.artworks.generatePoster(user, artworkId, dto.templateKey);
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
