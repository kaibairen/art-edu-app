import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';
import { PosterService } from '../posters/poster.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../common/types';

@Injectable()
export class ArtworksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly posters: PosterService,
  ) {}

  listAllStudents() {
    return this.prisma.student.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async listTeacherStudents(teacherId: string) {
    const rows = await this.prisma.teacherStudent.findMany({
      where: { teacherId },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.student);
  }

  async listParentChildren(parentId: string) {
    const ids = await this.access.listBoundStudentIdsForParent(parentId);
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.student.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getStudentFor(user: AuthUser, studentId: string) {
    if (user.role === Role.parent) {
      await this.access.assertParentOwnsStudent(user.id, studentId);
    } else if (user.role === Role.teacher) {
      await this.access.assertTeacherOwnsStudent(user.id, studentId);
    }
    return this.access.getStudentOrThrow(studentId);
  }

  async timeline(user: AuthUser, studentId: string) {
    await this.getStudentFor(user, studentId);
    const artworks = await this.prisma.artwork.findMany({
      where: { studentId },
      orderBy: { createdOn: 'desc' },
      include: {
        teacher: { select: { id: true, name: true } },
        posters: { orderBy: { createdAt: 'desc' } },
      },
    });
    return { studentId, items: artworks };
  }

  async getArtwork(user: AuthUser, artworkId: string) {
    if (user.role === Role.parent) {
      return this.access.assertParentOwnsArtwork(user.id, artworkId);
    }
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) {
      throw new NotFoundException('作品不存在');
    }
    if (user.role === Role.teacher) {
      await this.access.assertTeacherOwnsStudent(user.id, artwork.studentId);
    }
    return artwork;
  }

  async createArtwork(params: {
    teacherId: string;
    studentId: string;
    theme: string;
    createdOn: string;
    textComment?: string;
    file: Express.Multer.File;
  }) {
    await this.access.assertTeacherOwnsStudent(
      params.teacherId,
      params.studentId,
    );
    const stored = await this.storage.putObject(
      `artworks/${params.studentId}/${randomUUID()}-${params.file.originalname}`,
      params.file.buffer,
      params.file.mimetype || 'image/jpeg',
    );
    return this.prisma.artwork.create({
      data: {
        studentId: params.studentId,
        teacherId: params.teacherId,
        imageUrl: stored.url,
        theme: params.theme,
        createdOn: new Date(params.createdOn),
        textComment: params.textComment,
        voiceCommentUrl: null,
        videoCommentUrl: null,
      },
    });
  }

  async comment(
    teacherId: string,
    artworkId: string,
    patch: { textComment?: string; theme?: string },
  ) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) {
      throw new NotFoundException('作品不存在');
    }
    await this.access.assertTeacherOwnsStudent(teacherId, artwork.studentId);
    return this.prisma.artwork.update({
      where: { id: artworkId },
      data: {
        textComment: patch.textComment ?? artwork.textComment,
        theme: patch.theme ?? artwork.theme,
      },
    });
  }

  async generatePoster(user: AuthUser, artworkId: string, templateKey: string) {
    const artwork = await this.getArtwork(user, artworkId);
    return this.posters.generate(artwork, templateKey);
  }
}
