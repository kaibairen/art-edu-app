/**
 * MSW 示例（默认不接入 main.ts，避免新增业务页 / 体验验收）。
 * 需要时：`npm i -D msw` 后 `worker.start()`。
 *
 * preview / download 必须是不同 URL。
 */
import {
  EXAMPLE_ARTWORK,
  EXAMPLE_ARTWORK_PAGE,
  EXAMPLE_BRAND,
  EXAMPLE_FORBIDDEN_READ,
  EXAMPLE_LOGIN_RESPONSE,
  EXAMPLE_POSTER_DOWNLOAD,
  EXAMPLE_POSTER_PREVIEW,
  EXAMPLE_STUDENT,
} from '@art-edu/api-types';

export const MSW_P0_HANDLERS_DOC = {
  brand: EXAMPLE_BRAND,
  login: EXAMPLE_LOGIN_RESPONSE,
  children: [EXAMPLE_STUDENT],
  artworks: EXAMPLE_ARTWORK_PAGE,
  artwork: EXAMPLE_ARTWORK,
  posterPreview: EXAMPLE_POSTER_PREVIEW,
  posterDownload: EXAMPLE_POSTER_DOWNLOAD,
  forbiddenRead: EXAMPLE_FORBIDDEN_READ,
} as const;

export function assertPosterUrlsDistinct(): void {
  if (
    MSW_P0_HANDLERS_DOC.posterPreview.previewUrl ===
    MSW_P0_HANDLERS_DOC.posterDownload.downloadUrl
  ) {
    throw new Error('Mock poster previewUrl 不得等于 downloadUrl');
  }
}

/**
 * 伪代码（勿在业务页引用）：
 *
 * http.post('http://localhost:4010/api/v1/parent/artworks/:id/posters/preview',
 *   () => HttpResponse.json(EXAMPLE_POSTER_PREVIEW))
 * http.post('http://localhost:4010/api/v1/parent/artworks/:id/posters',
 *   () => HttpResponse.json(EXAMPLE_POSTER_DOWNLOAD))
 */
export const MSW_POSTER_ROUTES = [
  {
    method: 'POST',
    path: 'http://localhost:4010/api/v1/parent/artworks/:id/posters/preview',
    body: EXAMPLE_POSTER_PREVIEW,
  },
  {
    method: 'POST',
    path: 'http://localhost:4010/api/v1/parent/artworks/:id/posters',
    body: EXAMPLE_POSTER_DOWNLOAD,
  },
] as const;
