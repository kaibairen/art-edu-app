import assert from 'node:assert/strict';
import {
  ACCOUNT_DISABLED_ISSUED_TOKEN,
  ACCOUNT_DISABLED_ON_LOGIN,
  API_ERROR_CODES,
  API_ERROR_DEFS,
  CONFLICT_BINDING_MESSAGE,
  FORBIDDEN_READ_MESSAGE,
} from './error-codes';
import {
  POSTER_TEMPLATE_KEYS,
  STUDENT_STATUSES,
  USER_STATUSES,
  WATERMARK_POSITIONS,
} from './dto';
import { mapErrorBody } from './errors';
import {
  EXAMPLE_ACCOUNT,
  EXAMPLE_ACCOUNT_DISABLED,
  EXAMPLE_ACCOUNT_DISABLED_ISSUED_TOKEN,
  EXAMPLE_CONFLICT_BINDING,
  EXAMPLE_CONFLICT_STUDENT_HAS_ARTWORK,
  EXAMPLE_FORBIDDEN_READ,
  EXAMPLE_POSTER_DOWNLOAD,
  EXAMPLE_POSTER_DOWNLOAD_URL,
  EXAMPLE_POSTER_PREVIEW,
  EXAMPLE_POSTER_PREVIEW_URL,
  EXAMPLE_STUDENT,
  EXAMPLE_PUBLIC_FEATURED_ARTWORK,
  EXAMPLE_PUBLIC_HOME,
} from './examples';
import {
  COURSE_SUMMARY_MAX_LENGTH,
  P1_HOME_PATHS,
  PUBLIC_FEATURED_ARTWORK_FIELDS,
} from './dto';

assert.ok(API_ERROR_CODES.includes('CONFLICT_BINDING'));
assert.ok(API_ERROR_CODES.includes('CONFLICT_STUDENT_HAS_ARTWORK'));
assert.ok(API_ERROR_CODES.includes('ACCOUNT_DISABLED'));
assert.ok(API_ERROR_CODES.includes('LOGO_NOT_CONFIGURED'));
assert.deepEqual(POSTER_TEMPLATE_KEYS, ['simple', 'frame', 'magazine']);
assert.deepEqual(STUDENT_STATUSES, ['active', 'archived']);
assert.deepEqual(USER_STATUSES, ['active', 'disabled']);
assert.ok(WATERMARK_POSITIONS.includes('bottomRight'));
assert.equal(EXAMPLE_STUDENT.status, 'active');
assert.equal(EXAMPLE_STUDENT.className, '创意水彩班');
assert.equal(EXAMPLE_ACCOUNT.displayName, '林老师');
assert.equal(EXAMPLE_ACCOUNT.status, 'active');
assert.deepEqual(EXAMPLE_ACCOUNT.classNames, ['创意水彩班']);
assert.ok(!('name' in EXAMPLE_ACCOUNT));
assert.ok(!('disabled' in EXAMPLE_ACCOUNT));

assert.notEqual(
  EXAMPLE_POSTER_PREVIEW.previewUrl,
  EXAMPLE_POSTER_DOWNLOAD.downloadUrl,
  'previewPoster / downloadPoster 禁止返回同一资源',
);
assert.equal(EXAMPLE_POSTER_PREVIEW.previewUrl, EXAMPLE_POSTER_PREVIEW_URL);
assert.equal(EXAMPLE_POSTER_DOWNLOAD.downloadUrl, EXAMPLE_POSTER_DOWNLOAD_URL);
assert.match(EXAMPLE_POSTER_PREVIEW_URL, /-preview\.png$/);
assert.match(EXAMPLE_POSTER_DOWNLOAD_URL, /simple\.png$/);
assert.notEqual(EXAMPLE_POSTER_PREVIEW_URL, EXAMPLE_POSTER_DOWNLOAD_URL);

assert.equal(EXAMPLE_FORBIDDEN_READ.message, FORBIDDEN_READ_MESSAGE);
assert.equal(EXAMPLE_FORBIDDEN_READ.code, 'NOT_FOUND');

const mapped = mapErrorBody(404, EXAMPLE_FORBIDDEN_READ);
assert.equal(mapped.code, 'NOT_FOUND');
assert.equal(mapped.message, FORBIDDEN_READ_MESSAGE);
assert.equal(mapped.status, 404);

assert.equal(API_ERROR_DEFS.CONFLICT_BINDING.status, 409);
assert.equal(API_ERROR_DEFS.CONFLICT_BINDING.message, '已绑定');
assert.equal(EXAMPLE_CONFLICT_BINDING.message, CONFLICT_BINDING_MESSAGE);
assert.equal(
  mapErrorBody(409, EXAMPLE_CONFLICT_BINDING).status,
  API_ERROR_DEFS.CONFLICT_BINDING.status,
);

assert.equal(API_ERROR_DEFS.CONFLICT_STUDENT_HAS_ARTWORK.status, 409);
assert.equal(
  mapErrorBody(409, EXAMPLE_CONFLICT_STUDENT_HAS_ARTWORK).code,
  'CONFLICT_STUDENT_HAS_ARTWORK',
);

assert.equal(ACCOUNT_DISABLED_ON_LOGIN.code, 'ACCOUNT_DISABLED');
assert.equal(ACCOUNT_DISABLED_ON_LOGIN.status, 403);
assert.equal(ACCOUNT_DISABLED_ISSUED_TOKEN.code, 'UNAUTHORIZED');
assert.equal(ACCOUNT_DISABLED_ISSUED_TOKEN.status, 401);
assert.equal(
  mapErrorBody(403, EXAMPLE_ACCOUNT_DISABLED).status,
  403,
);
assert.equal(
  mapErrorBody(401, EXAMPLE_ACCOUNT_DISABLED_ISSUED_TOKEN).code,
  'UNAUTHORIZED',
);

const featuredKeys = Object.keys(EXAMPLE_PUBLIC_FEATURED_ARTWORK).sort();
assert.deepEqual(featuredKeys, [...PUBLIC_FEATURED_ARTWORK_FIELDS].sort());
assert.ok(!('commentText' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
assert.ok(!('teacherComment' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
assert.ok(!('comment' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
assert.ok(!('studentId' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
assert.ok(!('note' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
assert.ok(!('点评' in EXAMPLE_PUBLIC_FEATURED_ARTWORK));
for (const card of EXAMPLE_PUBLIC_HOME.featuredArtworks) {
  assert.deepEqual(Object.keys(card).sort(), [...PUBLIC_FEATURED_ARTWORK_FIELDS].sort());
}
for (const course of EXAMPLE_PUBLIC_HOME.courses) {
  assert.ok(!('body' in course));
  assert.ok(course.summary.length <= COURSE_SUMMARY_MAX_LENGTH);
}
assert.equal(EXAMPLE_PUBLIC_HOME.brand.logoUrl, null);
assert.equal(P1_HOME_PATHS.publicHome, '/public/home');
assert.equal(P1_HOME_PATHS.adminBanners, '/admin/home/banners');
assert.equal(P1_HOME_PATHS.adminFeaturedArtworks, '/admin/home/featured-artworks');
assert.equal(
  P1_HOME_PATHS.adminFeaturedFromArtworks,
  '/admin/home/featured-artworks/from-artworks',
);

console.log('api-types examples and error mapping ok');
