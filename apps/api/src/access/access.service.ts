import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Artwork } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 家长/教师数据隔离的唯一入口。
 * 家长侧所有学员/作品查询必须经过本服务，禁止绕过绑定关系。
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

  async assertParentOwnsStudent(parentId: string, studentId: string) {
    const binding = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
    if (!binding) {
      throw new ForbiddenException('无权访问该学员数据');
    }
  }

  async assertTeacherOwnsStudent(teacherId: string, studentId: string) {
    const binding = await this.prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    if (!binding) {
      throw new ForbiddenException('无权操作未负责的学员');
    }
  }

  async assertParentOwnsArtwork(
    parentId: string,
    artworkId: string,
  ): Promise<Artwork> {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) {
      throw new NotFoundException('作品不存在');
    }
    await this.assertParentOwnsStudent(parentId, artwork.studentId);
    return artwork;
  }

  async getStudentOrThrow(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('学员不存在');
    }
    return student;
  }
}
