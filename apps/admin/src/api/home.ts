import type {
  AdminBanner,
  AdminCourse,
  AdminFeaturedArtwork,
  CreateBannerRequest,
  CreateCourseRequest,
  CreateFeaturedArtworkRequest,
  CreateFeaturedFromArtworksRequest,
  HomeAdminList,
  PublicHome,
  ReorderHomeItemsRequest,
  UpdateBannerRequest,
  UpdateBannerStatusRequest,
  UpdateCourseRequest,
  UpdateFeaturedArtworkRequest,
  UpdatePublishStatusRequest,
} from '@art-edu/api-types';
import * as ApiTypes from '@art-edu/api-types';
import { http } from './http';

const P1_HOME_PATHS = ApiTypes.P1_HOME_PATHS;

async function listItems<T>(path: string): Promise<T[]> {
  const { data } = await http.get<HomeAdminList<T>>(path);
  return data.items ?? [];
}

export function getPublicHome(): Promise<PublicHome> {
  return http.get<PublicHome>(P1_HOME_PATHS.publicHome).then((res) => res.data);
}

export function listBanners(): Promise<AdminBanner[]> {
  return listItems<AdminBanner>(P1_HOME_PATHS.adminBanners);
}

export function createBanner(body: CreateBannerRequest): Promise<AdminBanner> {
  return http.post<AdminBanner>(P1_HOME_PATHS.adminBanners, body).then((res) => res.data);
}

export function updateBanner(id: string, body: UpdateBannerRequest): Promise<AdminBanner> {
  return http.patch<AdminBanner>(P1_HOME_PATHS.adminBanner(id), body).then((res) => res.data);
}

export function updateBannerStatus(
  id: string,
  body: UpdateBannerStatusRequest,
): Promise<AdminBanner> {
  return http
    .patch<AdminBanner>(P1_HOME_PATHS.adminBannerStatus(id), body)
    .then((res) => res.data);
}

export function reorderBanners(body: ReorderHomeItemsRequest): Promise<HomeAdminList<AdminBanner>> {
  return http
    .patch<HomeAdminList<AdminBanner>>(P1_HOME_PATHS.adminBannersReorder, body)
    .then((res) => res.data);
}

export function deleteBanner(id: string): Promise<{ ok: true }> {
  return http.delete<{ ok: true }>(P1_HOME_PATHS.adminBanner(id)).then((res) => res.data);
}

export function listCourses(): Promise<AdminCourse[]> {
  return listItems<AdminCourse>(P1_HOME_PATHS.adminCourses);
}

export function createCourse(body: CreateCourseRequest): Promise<AdminCourse> {
  return http.post<AdminCourse>(P1_HOME_PATHS.adminCourses, body).then((res) => res.data);
}

export function updateCourse(id: string, body: UpdateCourseRequest): Promise<AdminCourse> {
  return http.patch<AdminCourse>(P1_HOME_PATHS.adminCourse(id), body).then((res) => res.data);
}

export function updateCourseStatus(
  id: string,
  body: UpdatePublishStatusRequest,
): Promise<AdminCourse> {
  return http
    .patch<AdminCourse>(P1_HOME_PATHS.adminCourseStatus(id), body)
    .then((res) => res.data);
}

export function reorderCourses(body: ReorderHomeItemsRequest): Promise<HomeAdminList<AdminCourse>> {
  return http
    .patch<HomeAdminList<AdminCourse>>(P1_HOME_PATHS.adminCoursesReorder, body)
    .then((res) => res.data);
}

export function deleteCourse(id: string): Promise<{ ok: true }> {
  return http.delete<{ ok: true }>(P1_HOME_PATHS.adminCourse(id)).then((res) => res.data);
}

export function listFeaturedArtworks(): Promise<AdminFeaturedArtwork[]> {
  return listItems<AdminFeaturedArtwork>(P1_HOME_PATHS.adminFeaturedArtworks);
}

export function createFeaturedArtwork(
  body: CreateFeaturedArtworkRequest,
): Promise<AdminFeaturedArtwork> {
  return http
    .post<AdminFeaturedArtwork>(P1_HOME_PATHS.adminFeaturedArtworks, body)
    .then((res) => res.data);
}

export function createFeaturedFromArtworks(
  body: CreateFeaturedFromArtworksRequest,
): Promise<HomeAdminList<AdminFeaturedArtwork>> {
  return http
    .post<HomeAdminList<AdminFeaturedArtwork>>(P1_HOME_PATHS.adminFeaturedFromArtworks, body)
    .then((res) => res.data);
}

export function updateFeaturedArtwork(
  id: string,
  body: UpdateFeaturedArtworkRequest,
): Promise<AdminFeaturedArtwork> {
  return http
    .patch<AdminFeaturedArtwork>(P1_HOME_PATHS.adminFeaturedArtwork(id), body)
    .then((res) => res.data);
}

export function updateFeaturedArtworkStatus(
  id: string,
  body: UpdatePublishStatusRequest,
): Promise<AdminFeaturedArtwork> {
  return http
    .patch<AdminFeaturedArtwork>(P1_HOME_PATHS.adminFeaturedArtworkStatus(id), body)
    .then((res) => res.data);
}

export function reorderFeaturedArtworks(
  body: ReorderHomeItemsRequest,
): Promise<HomeAdminList<AdminFeaturedArtwork>> {
  return http
    .patch<HomeAdminList<AdminFeaturedArtwork>>(P1_HOME_PATHS.adminFeaturedArtworksReorder, body)
    .then((res) => res.data);
}

export function deleteFeaturedArtwork(id: string): Promise<{ ok: true }> {
  return http.delete<{ ok: true }>(P1_HOME_PATHS.adminFeaturedArtwork(id)).then((res) => res.data);
}

export function moveOrderedIds(ids: string[], id: string, dir: -1 | 1): string[] | null {
  const index = ids.indexOf(id);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return null;
  const next = ids.slice();
  const current = next[index];
  const swap = next[nextIndex];
  if (current === undefined || swap === undefined) return null;
  next[index] = swap;
  next[nextIndex] = current;
  return next;
}
