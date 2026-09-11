import assert from 'node:assert/strict';
import {
  API_ERROR_CODES,
  FORBIDDEN_READ_MESSAGE,
} from './error-codes';
import {
  POSTER_TEMPLATE_KEYS,
  WATERMARK_POSITIONS,
} from './dto';
import { mapErrorBody } from './errors';
import {
  EXAMPLE_FORBIDDEN_READ,
  EXAMPLE_POSTER_DOWNLOAD,
  EXAMPLE_POSTER_DOWNLOAD_URL,
  EXAMPLE_POSTER_PREVIEW,
  EXAMPLE_POSTER_PREVIEW_URL,
} from './examples';

assert.ok(API_ERROR_CODES.includes('CONFLICT_BINDING'));
assert.ok(API_ERROR_CODES.includes('CONFLICT_STUDENT_HAS_ARTWORK'));
assert.ok(API_ERROR_CODES.includes('ACCOUNT_DISABLED'));
assert.ok(API_ERROR_CODES.includes('LOGO_NOT_CONFIGURED'));
assert.deepEqual(POSTER_TEMPLATE_KEYS, ['simple', 'frame', 'magazine']);
assert.ok(WATERMARK_POSITIONS.includes('bottomRight'));

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

const disabled = mapErrorBody(403, {
  code: 'ACCOUNT_DISABLED',
  message: '账号已停用',
});
assert.equal(disabled.code, 'ACCOUNT_DISABLED');

console.log('api-types examples and error mapping ok');
