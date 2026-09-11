import { Injectable, NotFoundException } from '@nestjs/common';
import { HomeContentDto } from '../common/dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.homeContent.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  listPublished() {
    return this.prisma.homeContent.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(dto: HomeContentDto) {
    return this.prisma.homeContent.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
      },
    });
  }

  async update(id: string, dto: HomeContentDto) {
    const existing = await this.prisma.homeContent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('首页内容不存在');
    }
    return this.prisma.homeContent.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        published: dto.published,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.homeContent.delete({ where: { id } });
    return { ok: true };
  }
}
