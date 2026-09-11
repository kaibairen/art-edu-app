# @art-edu/api-types

`/api/v1` TypeScript DTO 与错误码。P0 仍带 Mock 示例；P1 US-P1-01 对齐 Nest 公开首页。

契约：

- P0 [`docs/contracts/openapi-p0.yaml`](../../docs/contracts/openapi-p0.yaml)
- P1 [`docs/contracts/openapi-p1.yaml`](../../docs/contracts/openapi-p1.yaml)（`PublicHome` / `P1_HOME_PATHS`）

公开优秀作品卡字段仅 `id` / `imageUrl` / `title` / `studentDisplayName`，禁止 `commentText`。

海报两个接口（禁止 URL 相同）：

- `previewPoster` → `POST /parent/artworks/{id}/posters/preview` → `{ previewUrl, templateKey }`
- `downloadPoster` → `POST /parent/artworks/{id}/posters` → `{ downloadUrl, templateKey }`

示例见 `EXAMPLE_POSTER_PREVIEW` / `EXAMPLE_POSTER_DOWNLOAD`（`…-preview.png` vs `….png`）。

定稿错误码常量：`API_ERROR_DEFS`

- `CONFLICT_BINDING` 409「已绑定」
- `CONFLICT_STUDENT_HAS_ARTWORK` 409；`Student.status` = `active` | `archived`
- `ACCOUNT_DISABLED` 登录 403；已发 Token → `UNAUTHORIZED` 401
