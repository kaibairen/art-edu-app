# P0 API Mock 联调

本目录提供契约与 Prism Mock。业务页已按 [FRONTEND_READY.md](../../FRONTEND_READY.md) 对接真后端 `/api/v1`；Mock 字段名仍偏 OpenAPI 旧稿，仅作对照。

权威契约：[`openapi-p0.yaml`](./openapi-p0.yaml)（仓库内无 `backend/openapi-p0.yaml` 时以此为准）。

- Base：`/api/v1`
- Header：`Authorization: Bearer {accessToken}`
- 成功：直接返回资源
- 失败：`{ code, message, details? }`
- 越权读：`404 NOT_FOUND`「无法查看」
- 定稿错误码（与 `@art-edu/api-types` 的 `API_ERROR_DEFS` 一致）：
  - `CONFLICT_BINDING` **409**「已绑定」
  - `CONFLICT_STUDENT_HAS_ARTWORK` **409**；`Student.status` = `active` | `archived`（有作品请归档，勿删）
  - `ACCOUNT_DISABLED` **403** 仅登录；已签发 Token → **401** `UNAUTHORIZED`

海报是**两个接口**，禁止两 URL 相同：

| 方法 | 路径 | 响应 | Client |
| --- | --- | --- | --- |
| POST | `/parent/artworks/{id}/posters/preview` | `{ previewUrl, templateKey }` | `previewPoster` |
| POST | `/parent/artworks/{id}/posters` | `{ downloadUrl, templateKey }` | `downloadPoster` |

Mock 示例必须区分文件名，例如：

- preview：`http://localhost:4010/files/posters/aw-demo-simple-preview.png`
- download：`http://localhost:4010/files/posters/aw-demo-simple.png`

## Prism

OpenAPI 的 path 已带 `/api/v1` 前缀，Prism 监听 `4010` 后，client `baseURL` 用 `http://localhost:4010/api/v1`。

```bash
# 一次性
npx --yes @stoplight/prism-cli@5 mock docs/contracts/openapi-p0.yaml -p 4010 -h 0.0.0.0

# 或 docker compose profile
docker compose --profile mock up prism
```

冒烟（无需业务页）：

```bash
curl -s http://localhost:4010/api/v1/brand
curl -s -X POST http://localhost:4010/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"account":"13800000002","password":"Parent123"}'
curl -s -X POST http://localhost:4010/api/v1/parent/artworks/aw-demo/posters/preview \
  -H 'authorization: Bearer mock-access-token' \
  -H 'content-type: application/json' \
  -d '{"templateKey":"simple"}'
# → {"previewUrl":"...-preview.png","templateKey":"simple"}
curl -s -X POST http://localhost:4010/api/v1/parent/artworks/aw-demo/posters \
  -H 'authorization: Bearer mock-access-token' \
  -H 'content-type: application/json' \
  -d '{"templateKey":"simple"}'
# → {"downloadUrl":".../aw-demo-simple.png","templateKey":"simple"}
```

管理端指向 Mock：

```bash
# apps/admin/.env.local
VITE_P0_API_BASE_URL=http://localhost:4010/api/v1
```

管理端业务页走 `VITE_API_BASE_URL`（默认 `/api/v1`）。`VITE_P0_API_BASE_URL` 仅给 `src/api/p0` Mock client。

## MSW

示例 handler 见 [`apps/admin/src/api/p0/msw.example.ts`](../../apps/admin/src/api/p0/msw.example.ts)，默认不挂到应用入口。需要时自行 `worker.start()`。

要点：preview / download 必须返回不同 URL，不要写 `previewUrl = downloadUrl`。
