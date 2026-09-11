import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BindDto, CreateStudentDto, CreateUserDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async createUser(dto: CreateUserDto) {
    if (dto.role === Role.admin) {
      throw new BadRequestException('管理端不可通过此接口创建管理员');
    }
    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (exists) {
      throw new BadRequestException('手机号已存在');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  listStudents() {
    return this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parentBindings: {
          include: { parent: { select: { id: true, name: true, phone: true } } },
        },
        teacherBindings: {
          include: {
            teacher: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
  }

  createStudent(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        name: dto.name,
        gender: dto.gender,
        note: dto.note,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async bindParent(dto: BindDto) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
    ]);
    if (!parent || parent.role !== Role.parent) {
      throw new BadRequestException('用户不是家长');
    }
    if (!student) {
      throw new NotFoundException('学员不存在');
    }
    return this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: { parentId: parent.id, studentId: student.id },
      },
      update: {},
      create: { parentId: parent.id, studentId: student.id },
    });
  }

  async bindTeacher(dto: BindDto) {
    const [teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
    ]);
    if (!teacher || teacher.role !== Role.teacher) {
      throw new BadRequestException('用户不是教师');
    }
    if (!student) {
      throw new NotFoundException('学员不存在');
    }
    return this.prisma.teacherStudent.upsert({
      where: {
        teacherId_studentId: { teacherId: teacher.id, studentId: student.id },
      },
      update: {},
      create: { teacherId: teacher.id, studentId: student.id },
    });
  }

  async unbindParent(dto: BindDto) {
    await this.prisma.parentStudent.deleteMany({
      where: { parentId: dto.userId, studentId: dto.studentId },
    });
    return { ok: true };
  }

  async unbindTeacher(dto: BindDto) {
    await this.prisma.teacherStudent.deleteMany({
      where: { teacherId: dto.userId, studentId: dto.studentId },
    });
    return { ok: true };
  }
}
