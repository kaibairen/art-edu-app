# @art-edu/api-types

P0 `/api/v1` TypeScript DTO 与错误码。**Mock 骨架 only，业务页冻结。**

契约：[`docs/contracts/openapi-p0.yaml`](../../docs/contracts/openapi-p0.yaml)。

海报两个接口（禁止 URL 相同）：

- `previewPoster` → `POST /parent/artworks/{id}/posters/preview` → `{ previewUrl, templateKey }`
- `downloadPoster` → `POST /parent/artworks/{id}/posters` → `{ downloadUrl, templateKey }`

示例见 `EXAMPLE_POSTER_PREVIEW` / `EXAMPLE_POSTER_DOWNLOAD`（`…-preview.png` vs `….png`）。
