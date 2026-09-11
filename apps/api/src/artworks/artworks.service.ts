import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';
import { PosterService } from '../posters/poster.service';
import { StorageService } from '../storage/storage.service';
import { Errors } from '../common/errors';
import { toArtworkDto, toStudentDto } from '../common/mappers';
import { cursorWhere, parseLimit, toPage } from '../common/pagination';
import { AuthUser } from '../common/types';

@Injectable()
export class ArtworksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly posters: PosterService,
  ) {}

  async listTeacherStudents(
    user: AuthUser,
    query: { cursor?: string; limit?: number },
  ) {
    const limit = parseLimit(query.limit);
    const extra = cursorWhere(query.cursor);
    const where =
      user.role === Role.admin
        ? { ...(extra ?? {}) }
        : {
            className: { in: await this.teacherClassNames(user.id) },
            ...(extra ?? {}),
          };
    const rows = await this.prisma.student.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { _count: { select: { parentBindings: true } } },
    });
    return toPage(rows, limit, toStudentDto);
  }

  async listParentChildren(parentId: string) {
    const ids = await this.access.listBoundStudentIdsForParent(parentId);
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.student.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { parentBindings: true } } },
    });
    return rows.map(toStudentDto);
  }

  async listArtworks(
    user: AuthUser,
    studentId: string,
    query: { cursor?: string; limit?: number },
  ) {
    const student = await this.access.loadStudentFor(user, studentId);
    const limit = parseLimit(query.limit);
    const extra = cursorWhere(query.cursor);
    const rows = await this.prisma.artwork.findMany({
      where: { studentId, ...(extra ?? {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { student: { select: { name: true } } },
    });
    return toPage(rows, limit, (row) => toArtworkDto(row, student.name));
  }

  async getArtwork(user: AuthUser, artworkId: string) {
    const artwork = await this.access.loadArtworkFor(user, artworkId);
    const student = await this.prisma.student.findUnique({
      where: { id: artwork.studentId },
    });
    return toArtworkDto(artwork, student?.name);
  }

  async createArtwork(params: {
    teacherId: string;
    studentId: string;
    title?: string;
    createdAt?: string;
    courseTheme?: string;
    file: Express.Multer.File;
  }) {
    await this.access.assertTeacherOwnsStudent(params.teacherId, params.studentId);
    const imageKey = `artworks/${params.studentId}/${randomUUID()}-${params.file.originalname}`;
    const stored = await this.storage.putObject(
      imageKey,
      params.file.buffer,
      params.file.mimetype || 'image/jpeg',
    );
    const thumbBuf = await sharp(params.file.buffer)
      .resize(480, 480, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();
    const thumb = await this.storage.putObject(
      `artworks/${params.studentId}/thumbs/${randomUUID()}.jpg`,
      thumbBuf,
      'image/jpeg',
    );
    const createdAt = params.createdAt ? new Date(params.createdAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      throw Errors.validation('创作时间格式不正确');
    }
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: params.studentId },
    });
    const artwork = await this.prisma.artwork.create({
      data: {
        studentId: params.studentId,
        teacherId: params.teacherId,
        imageUrl: stored.url,
        thumbUrl: thumb.url,
        title: params.title,
        courseTheme: params.courseTheme,
        createdAt,
        commentText: null,
      },
      include: { student: { select: { name: true } } },
    });
    return toArtworkDto(artwork, student.name);
  }

  async comment(teacherId: string, artworkId: string, text: string) {
    await this.access.assertTeacherOwnsArtwork(teacherId, artworkId);
    const artwork = await this.prisma.artwork.update({
      where: { id: artworkId },
      data: { commentText: text },
      include: { student: { select: { name: true } } },
    });
    return toArtworkDto(artwork);
  }

  async generatePoster(
    user: AuthUser,
    artworkId: string,
    templateKey: string,
    mode: 'preview' | 'download',
  ) {
    const artwork = await this.access.loadArtworkFor(user, artworkId);
    return this.posters.generate(artwork, templateKey, mode);
  }

  private async teacherClassNames(teacherId: string): Promise<string[]> {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    return teacher?.classNames ?? [];
  }
}
