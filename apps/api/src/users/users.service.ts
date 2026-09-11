import { Injectable } from '@nestjs/common';
import { Prisma, Role, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountDto,
  CreateBindingDto,
  CreateStudentDto,
  UpdateAccountDto,
  UpdateAccountStatusDto,
  UpdateStudentDto,
} from '../common/dto';
import { Errors } from '../common/errors';
import { toAccountDto, toBindingDto, toStudentDto } from '../common/mappers';
import { cursorWhere, parseLimit, toPage } from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(query: { role?: Role; cursor?: string; limit?: number }) {
    const limit = parseLimit(query.limit);
    const extra = cursorWhere(query.cursor);
    const rows = await this.prisma.user.findMany({
      where: {
        ...(query.role ? { role: query.role } : {}),
        ...(extra ?? {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    return toPage(rows, limit, toAccountDto);
  }

  async getAccount(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw Errors.notFound('账号不存在');
    }
    return toAccountDto(user);
  }

  async createAccount(dto: CreateAccountDto) {
    if (dto.role === Role.admin) {
      throw Errors.validation('管理端不可通过此接口创建管理员');
    }
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) {
      throw Errors.conflictPhone();
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        displayName: dto.displayName,
        role: dto.role,
        passwordHash,
        classNames: dto.role === Role.teacher ? dto.classNames ?? [] : [],
      },
    });
    return toAccountDto(user);
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw Errors.notFound('账号不存在');
    }
    const data: Prisma.UserUpdateInput = {
      displayName: dto.displayName,
      email: dto.email,
    };
    if (dto.classNames && user.role === Role.teacher) {
      data.classNames = dto.classNames;
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    const updated = await this.prisma.user.update({ where: { id }, data });
    return toAccountDto(updated);
  }

  async updateAccountStatus(id: string, dto: UpdateAccountStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw Errors.notFound('账号不存在');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });
    if (dto.status === 'disabled') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return toAccountDto(updated);
  }

  async listStudents(query: { cursor?: string; limit?: number }) {
    const limit = parseLimit(query.limit);
    const extra = cursorWhere(query.cursor);
    const rows = await this.prisma.student.findMany({
      where: extra,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { _count: { select: { parentBindings: true } } },
    });
    return toPage(rows, limit, toStudentDto);
  }

  async getStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { _count: { select: { parentBindings: true } } },
    });
    if (!student) {
      throw Errors.notFound('学员不存在');
    }
    return toStudentDto(student);
  }

  async createStudent(dto: CreateStudentDto) {
    const student = await this.prisma.student.create({
      data: {
        name: dto.name,
        className: dto.className,
        note: dto.note,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        status: StudentStatus.active,
      },
      include: { _count: { select: { parentBindings: true } } },
    });
    return toStudentDto(student);
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw Errors.notFound('学员不存在');
    }
    const student = await this.prisma.student.update({
      where: { id },
      data: {
        name: dto.name,
        className: dto.className,
        note: dto.note,
        status: dto.status,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
      include: { _count: { select: { parentBindings: true } } },
    });
    return toStudentDto(student);
  }

  async deleteStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { _count: { select: { artworks: true } } },
    });
    if (!student) {
      throw Errors.notFound('学员不存在');
    }
    if (student._count.artworks > 0) {
      throw Errors.conflictStudentHasArtwork();
    }
    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }

  async listBindings(query: { cursor?: string; limit?: number }) {
    const limit = parseLimit(query.limit);
    const extra = cursorWhere(query.cursor);
    const rows = await this.prisma.parentStudent.findMany({
      where: extra,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    return toPage(rows, limit, toBindingDto);
  }

  async createBinding(dto: CreateBindingDto) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.parentId } }),
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
    ]);
    if (!parent || parent.role !== Role.parent) {
      throw Errors.validation('用户不是家长');
    }
    if (!student) {
      throw Errors.notFound('学员不存在');
    }
    const existing = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: { parentId: parent.id, studentId: student.id },
      },
    });
    if (existing) {
      throw Errors.conflictBinding();
    }
    const row = await this.prisma.parentStudent.create({
      data: { parentId: parent.id, studentId: student.id },
    });
    return toBindingDto(row);
  }

  async deleteBinding(id: string) {
    const row = await this.prisma.parentStudent.findUnique({ where: { id } });
    if (!row) {
      throw Errors.notFound('绑定不存在');
    }
    await this.prisma.parentStudent.delete({ where: { id } });
    return { ok: true };
  }
}
