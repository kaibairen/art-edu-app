import { HomeBanner, HomeCourse, HomeFeaturedArtwork } from '@prisma/client';
import {
  AdminBannerDto,
  AdminCourseDto,
  AdminFeaturedArtworkDto,
  PublicBannerDto,
  PublicCourseDto,
  PublicFeaturedArtworkDto,
  PublicHomeBrandDto,
  PublicHomeDto,
} from '@art-edu/shared';
import { toIso } from '../common/mappers';

export function toPublicBanner(row: HomeBanner): PublicBannerDto {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    title: row.title,
    subtitle: row.subtitle,
    linkUrl: row.linkUrl,
    sortOrder: row.sortOrder,
  };
}

/** 公开优秀作品卡：显式白名单，禁止扩散点评 / 私人档案字段。 */
export function toPublicFeaturedArtwork(
  row: HomeFeaturedArtwork,
): PublicFeaturedArtworkDto {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    title: row.title,
    studentDisplayName: row.studentDisplayName,
  };
}

export function toPublicCourse(row: HomeCourse): PublicCourseDto {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    coverUrl: row.coverUrl,
  };
}

export function toPublicHome(params: {
  orgName: string | null;
  logoUrl: string | null;
  banners: HomeBanner[];
  featuredArtworks: HomeFeaturedArtwork[];
  courses: HomeCourse[];
}): PublicHomeDto {
  const brand: PublicHomeBrandDto = {
    orgName: params.orgName,
    logoUrl: params.logoUrl,
  };
  return {
    brand,
    banners: params.banners.map(toPublicBanner),
    featuredArtworks: params.featuredArtworks.map(toPublicFeaturedArtwork),
    courses: params.courses.map(toPublicCourse),
  };
}

export function toAdminBanner(row: HomeBanner): AdminBannerDto {
  return {
    ...toPublicBanner(row),
    enabled: row.enabled,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toAdminFeaturedArtwork(
  row: HomeFeaturedArtwork,
): AdminFeaturedArtworkDto {
  return {
    ...toPublicFeaturedArtwork(row),
    sortOrder: row.sortOrder,
    published: row.published,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toAdminCourse(row: HomeCourse): AdminCourseDto {
  return {
    ...toPublicCourse(row),
    sortOrder: row.sortOrder,
    published: row.published,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
