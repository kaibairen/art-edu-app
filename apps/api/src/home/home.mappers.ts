import {
  HomeCarousel,
  HomeCourse,
  HomeFeaturedArtwork,
} from '@prisma/client';
import {
  AdminCarouselDto,
  AdminCourseDto,
  AdminFeaturedArtworkDto,
  PublicCarouselDto,
  PublicCourseDto,
  PublicFeaturedArtworkDto,
  PublicHomeBrandDto,
  PublicHomeDto,
} from '@art-edu/shared';
import { toIso } from '../common/mappers';

export function toPublicCarousel(row: HomeCarousel): PublicCarouselDto {
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
  carousels: HomeCarousel[];
  featuredArtworks: HomeFeaturedArtwork[];
  courses: HomeCourse[];
}): PublicHomeDto {
  const brand: PublicHomeBrandDto = {
    orgName: params.orgName,
    logoUrl: params.logoUrl,
  };
  return {
    brand,
    carousels: params.carousels.map(toPublicCarousel),
    featuredArtworks: params.featuredArtworks.map(toPublicFeaturedArtwork),
    courses: params.courses.map(toPublicCourse),
  };
}

export function toAdminCarousel(row: HomeCarousel): AdminCarouselDto {
  return {
    ...toPublicCarousel(row),
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
