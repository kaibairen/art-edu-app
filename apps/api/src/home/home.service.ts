import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Errors } from '../common/errors';
import {
  CreateBannerDto,
  CreateCourseDto,
  CreateFeaturedArtworkDto,
  CreateFeaturedFromArtworksDto,
  ReorderHomeItemsDto,
  UpdateBannerDto,
  UpdateBannerStatusDto,
  UpdateCourseDto,
  UpdateFeaturedArtworkDto,
  UpdatePublishStatusDto,
} from './home.dto';
import {
  toAdminBanner,
  toAdminCourse,
  toAdminFeaturedArtwork,
  toPublicHome,
} from './home.mappers';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async publicHome() {
    const [settings, banners, featuredArtworks, courses] = await Promise.all([
      this.prisma.orgSetting.findUnique({ where: { id: 'default' } }),
      this.prisma.homeBanner.findMany({
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
      banners,
      courses,
      featuredArtworks,
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

  listBanners() {
    return this.prisma.homeBanner
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((items) => ({ items: items.map(toAdminBanner) }));
  }

  async getBanner(id: string) {
    const row = await this.prisma.homeBanner.findUnique({ where: { id } });
    if (!row) throw Errors.notFound('轮播不存在');
    return toAdminBanner(row);
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.homeBanner
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
      .then(toAdminBanner);
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    await this.getBanner(id);
    return this.prisma.homeBanner
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
      .then(toAdminBanner);
  }

  async updateBannerStatus(id: string, dto: UpdateBannerStatusDto) {
    await this.getBanner(id);
    return this.prisma.homeBanner
      .update({ where: { id }, data: { enabled: dto.enabled } })
      .then(toAdminBanner);
  }

  async reorderBanners(dto: ReorderHomeItemsDto) {
    await this.assertAllExist(dto.orderedIds, () =>
      this.prisma.homeBanner.findMany({
        where: { id: { in: dto.orderedIds } },
        select: { id: true },
      }),
      '轮播',
    );
    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.homeBanner.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.listBanners();
  }

  async removeBanner(id: string) {
    await this.getBanner(id);
    await this.prisma.homeBanner.delete({ where: { id } });
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

  async createFeaturedFromArtworks(dto: CreateFeaturedFromArtworksDto) {
    const artworks = await this.prisma.artwork.findMany({
      where: { id: { in: dto.artworkIds } },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        courseTheme: true,
        student: { select: { name: true } },
      },
    });
    const missing = dto.artworkIds.filter(
      (id) => !artworks.some((row) => row.id === id),
    );
    if (missing.length > 0) {
      throw Errors.notFound('作品不存在');
    }
    const maxSort = await this.prisma.homeFeaturedArtwork.aggregate({
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder ?? -1) + 1;
    const created = [];
    for (const id of dto.artworkIds) {
      const artwork = artworks.find((row) => row.id === id)!;
      const row = await this.prisma.homeFeaturedArtwork.create({
        data: {
          imageUrl: artwork.imageUrl,
          title: artwork.title ?? artwork.courseTheme ?? '未命名作品',
          studentDisplayName: artwork.student.name,
          sortOrder: nextSort,
          published: false,
        },
      });
      nextSort += 1;
      created.push(toAdminFeaturedArtwork(row));
    }
    return { items: created };
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

  async updateFeaturedArtworkStatus(id: string, dto: UpdatePublishStatusDto) {
    await this.getFeaturedArtwork(id);
    return this.prisma.homeFeaturedArtwork
      .update({ where: { id }, data: { published: dto.published } })
      .then(toAdminFeaturedArtwork);
  }

  async reorderFeaturedArtworks(dto: ReorderHomeItemsDto) {
    await this.assertAllExist(dto.orderedIds, () =>
      this.prisma.homeFeaturedArtwork.findMany({
        where: { id: { in: dto.orderedIds } },
        select: { id: true },
      }),
      '优秀作品',
    );
    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.homeFeaturedArtwork.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.listFeaturedArtworks();
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

  async updateCourseStatus(id: string, dto: UpdatePublishStatusDto) {
    await this.getCourse(id);
    return this.prisma.homeCourse
      .update({ where: { id }, data: { published: dto.published } })
      .then(toAdminCourse);
  }

  async reorderCourses(dto: ReorderHomeItemsDto) {
    await this.assertAllExist(dto.orderedIds, () =>
      this.prisma.homeCourse.findMany({
        where: { id: { in: dto.orderedIds } },
        select: { id: true },
      }),
      '课程',
    );
    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.homeCourse.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.listCourses();
  }

  async removeCourse(id: string) {
    await this.getCourse(id);
    await this.prisma.homeCourse.delete({ where: { id } });
    return { ok: true as const };
  }

  private async assertAllExist(
    orderedIds: string[],
    load: () => Promise<Array<{ id: string }>>,
    label: string,
  ) {
    const rows = await load();
    if (rows.length !== orderedIds.length) {
      throw Errors.notFound(`${label}不存在`);
    }
  }
}
