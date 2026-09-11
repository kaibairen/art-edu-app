import { Injectable } from '@nestjs/common';
import { Artwork, Role, Student } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Errors } from '../common/errors';
import { AuthUser } from '../common/types';

/**
 * 家长/教师数据隔离的唯一入口。
 * 越权读与资源不存在一律 404 NOT_FOUND「无法查看」，禁止暴露「存在但无权限」。
 */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async listBoundStudentIdsForParent(parentId: string): Promise<string[]> {
    const rows = await this.prisma.parentStudent.findMany({
      where: { parentId },
      select: { studentId: true },
    });
    return rows.map((r) => r.studentId);
  }

  async assertParentOwnsStudent(parentId: string, studentId: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw Errors.cannotView();
    }
    const binding = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
    if (!binding) {
      throw Errors.cannotView();
    }
    return student;
  }

  async assertTeacherOwnsStudent(teacherId: string, studentId: string): Promise<Student> {
    const [teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: teacherId } }),
      this.prisma.student.findUnique({ where: { id: studentId } }),
    ]);
    if (!teacher || teacher.role !== Role.teacher || !student) {
      throw Errors.cannotView();
    }
    if (!this.teacherCoversClass(teacher.classNames, student.className)) {
      throw Errors.cannotView();
    }
    return student;
  }

  async assertParentOwnsArtwork(parentId: string, artworkId: string): Promise<Artwork> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      throw Errors.cannotView();
    }
    await this.assertParentOwnsStudent(parentId, artwork.studentId);
    return artwork;
  }

  async assertTeacherOwnsArtwork(teacherId: string, artworkId: string): Promise<Artwork> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      throw Errors.cannotView();
    }
    await this.assertTeacherOwnsStudent(teacherId, artwork.studentId);
    return artwork;
  }

  teacherCoversClass(classNames: string[], className: string | null): boolean {
    if (!className) {
      return false;
    }
    return classNames.includes(className);
  }

  async loadStudentFor(user: AuthUser, studentId: string): Promise<Student> {
    if (user.role === Role.parent) {
      return this.assertParentOwnsStudent(user.id, studentId);
    }
    if (user.role === Role.teacher) {
      return this.assertTeacherOwnsStudent(user.id, studentId);
    }
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw Errors.cannotView();
    }
    return student;
  }

  async loadArtworkFor(user: AuthUser, artworkId: string): Promise<Artwork> {
    if (user.role === Role.parent) {
      return this.assertParentOwnsArtwork(user.id, artworkId);
    }
    if (user.role === Role.teacher) {
      return this.assertTeacherOwnsArtwork(user.id, artworkId);
    }
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      throw Errors.cannotView();
    }
    return artwork;
  }
}
