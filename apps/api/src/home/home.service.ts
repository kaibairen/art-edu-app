import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Errors } from '../common/errors';
import {
  CreateCarouselDto,
  CreateCourseDto,
  CreateFeaturedArtworkDto,
  UpdateCarouselDto,
  UpdateCourseDto,
  UpdateFeaturedArtworkDto,
} from './home.dto';
import {
  toAdminCarousel,
  toAdminCourse,
  toAdminFeaturedArtwork,
  toPublicHome,
} from './home.mappers';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async publicHome() {
    const [settings, carousels, featuredArtworks, courses] = await Promise.all([
      this.prisma.orgSetting.findUnique({ where: { id: 'default' } }),
      this.prisma.homeCarousel.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.homeFeaturedArtwork.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.homeCourse.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return toPublicHome({
      orgName: settings?.orgName ?? null,
      logoUrl: settings?.logoUrl ?? null,
      carousels,
      featuredArtworks,
      courses,
    });
  }

  async publicSettings() {
    const row = await this.prisma.orgSetting.findUnique({
      where: { id: 'default' },
    });
    return {
      orgName: row?.orgName ?? null,
      logoUrl: row?.logoUrl ?? null,
      watermarkText: row?.watermarkText ?? null,
    };
  }

  listCarousels() {
    return this.prisma.homeCarousel
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((items) => ({ items: items.map(toAdminCarousel) }));
  }

  async getCarousel(id: string) {
    const row = await this.prisma.homeCarousel.findUnique({ where: { id } });
    if (!row) throw Errors.notFound('轮播不存在');
    return toAdminCarousel(row);
  }

  createCarousel(dto: CreateCarouselDto) {
    return this.prisma.homeCarousel
      .create({
        data: {
          imageUrl: dto.imageUrl,
          title: dto.title ?? null,
          subtitle: dto.subtitle ?? null,
          linkUrl: dto.linkUrl ?? null,
          sortOrder: dto.sortOrder ?? 0,
          enabled: dto.enabled ?? false,
        },
      })
      .then(toAdminCarousel);
  }

  async updateCarousel(id: string, dto: UpdateCarouselDto) {
    await this.getCarousel(id);
    return this.prisma.homeCarousel
      .update({
        where: { id },
        data: {
          imageUrl: dto.imageUrl,
          title: dto.title,
          subtitle: dto.subtitle,
          linkUrl: dto.linkUrl,
          sortOrder: dto.sortOrder,
          enabled: dto.enabled,
        },
      })
      .then(toAdminCarousel);
  }

  async removeCarousel(id: string) {
    await this.getCarousel(id);
    await this.prisma.homeCarousel.delete({ where: { id } });
    return { ok: true as const };
  }

  listFeaturedArtworks() {
    return this.prisma.homeFeaturedArtwork
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((items) => ({ items: items.map(toAdminFeaturedArtwork) }));
  }

  async getFeaturedArtwork(id: string) {
    const row = await this.prisma.homeFeaturedArtwork.findUnique({
      where: { id },
    });
    if (!row) throw Errors.notFound('优秀作品不存在');
    return toAdminFeaturedArtwork(row);
  }

  createFeaturedArtwork(dto: CreateFeaturedArtworkDto) {
    return this.prisma.homeFeaturedArtwork
      .create({
        data: {
          imageUrl: dto.imageUrl,
          title: dto.title,
          studentDisplayName: dto.studentDisplayName,
          sortOrder: dto.sortOrder ?? 0,
          published: dto.published ?? false,
        },
      })
      .then(toAdminFeaturedArtwork);
  }

  async updateFeaturedArtwork(id: string, dto: UpdateFeaturedArtworkDto) {
    await this.getFeaturedArtwork(id);
    return this.prisma.homeFeaturedArtwork
      .update({
        where: { id },
        data: {
          imageUrl: dto.imageUrl,
          title: dto.title,
          studentDisplayName: dto.studentDisplayName,
          sortOrder: dto.sortOrder,
          published: dto.published,
        },
      })
      .then(toAdminFeaturedArtwork);
  }

  async removeFeaturedArtwork(id: string) {
    await this.getFeaturedArtwork(id);
    await this.prisma.homeFeaturedArtwork.delete({ where: { id } });
    return { ok: true as const };
  }

  listCourses() {
    return this.prisma.homeCourse
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((items) => ({ items: items.map(toAdminCourse) }));
  }

  async getCourse(id: string) {
    const row = await this.prisma.homeCourse.findUnique({ where: { id } });
    if (!row) throw Errors.notFound('课程不存在');
    return toAdminCourse(row);
  }

  createCourse(dto: CreateCourseDto) {
    return this.prisma.homeCourse
      .create({
        data: {
          title: dto.title,
          summary: dto.summary,
          coverUrl: dto.coverUrl ?? null,
          sortOrder: dto.sortOrder ?? 0,
          published: dto.published ?? false,
        },
      })
      .then(toAdminCourse);
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.getCourse(id);
    return this.prisma.homeCourse
      .update({
        where: { id },
        data: {
          title: dto.title,
          summary: dto.summary,
          coverUrl: dto.coverUrl,
          sortOrder: dto.sortOrder,
          published: dto.published,
        },
      })
      .then(toAdminCourse);
  }

  async removeCourse(id: string) {
    await this.getCourse(id);
    await this.prisma.homeCourse.delete({ where: { id } });
    return { ok: true as const };
  }
}
