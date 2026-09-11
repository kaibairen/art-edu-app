# API 契约变更（预研面 → API-MVP-P0-0.1）

基线：`cursor/art-edu-mvp-ec9b`（PR #1 / v0.1.0-mvp **预研**）。预研实现可跑，但**不能**视为已按本契约交付。

本期只对齐 P0。`/admin/home-contents` 与 `GET /public/home` 仍保留，**不作为本期验收**。

## 路径

| 预研 | 契约 |
| --- | --- |
| 前缀 `/api` | `/api/v1` |
| `POST /auth/login` 成功体含 `user` | `{ accessToken, role, displayName, refreshToken, expiresIn }` |
| 无 logout / refresh | `POST /auth/logout` → 204；`POST /auth/refresh` |
| `GET /auth/me` 含 `name`/`email` | `{ id, phone, role, displayName, status }` |
| `/admin/users` | `/admin/accounts`，并补 `GET/PATCH /{id}`、`PATCH /{id}/status` |
| `/admin/bindings/parent-student`（`userId`） | `/admin/bindings`（`parentId` + `studentId`），`DELETE /{id}` |
| 教师-学员显式绑定表 | 删除过滤逻辑；教师 `classNames[]` 匹配 `Student.className` |
| `/parent/children/{id}/timeline` | `/parent/children/{id}/artworks?cursor&limit` |
| `POST .../comment`（`textComment`） | `POST /teacher/artworks/{id}/comments`（`{ text }`） |
| `/admin/settings`、`/admin/settings/logo` | `/admin/brand`、`POST /admin/brand/logo`（字段 `file`） |
| 无只读品牌 | `GET /brand`（已登录） |

## 字段

| 预研 | 契约 |
| --- | --- |
| 登录 `account`（手机或邮箱） | `phone` |
| `User.name` | `displayName`；新增 `status=active\|disabled`、教师 `classNames[]` |
| 学员无班级/状态 | `className?`、`status=active\|archived`、`boundParentCount?` |
| Artwork `theme` / `createdOn` / `textComment` | `title?` / `createdAt`（创作时间倒序键） / `commentText?`，并补 `thumbUrl`、`courseTheme?`、`studentName` |
| 模板 `classic` / `gallery` / `festival` | `simple` / `frame` / `magazine`（简约 / 画框 / 杂志） |
| 品牌仅 orgName/logo/watermarkText | 补 `watermarkOpacity`、`watermarkPosition`、`templates[]` |
| 海报返回 `imageUrl` + `recipe` | 预览与下载拆端点：`POST .../posters/preview` → `{ previewUrl, templateKey }`；`POST .../posters` → `{ downloadUrl, templateKey }`。两 URL **必须不同** |

## 错误码与语义

成功直接返回资源。失败统一 `{ code, message, details? }`。

必须支持：`UNAUTHORIZED` 401、`FORBIDDEN` 403、`VALIDATION_ERROR` 400、`NOT_FOUND` 404、`ACCOUNT_DISABLED` 403（**仅登录**）、`CONFLICT_PHONE` 409、`CONFLICT_BINDING` 409、`CONFLICT_STUDENT_HAS_ARTWORK` 409、`LOGO_NOT_CONFIGURED` 400、`UPLOAD_TOO_LARGE` 413、`UNSUPPORTED_MEDIA` 415、`RATE_LIMITED` 429、`INTERNAL` 500。

破坏性语义：

- 家长未绑定 / 教师非负责：**HTTP 404**，`NOT_FOUND`，文案固定「无法查看」。预研是 403「无权访问」。
- 禁用账号登录：403 `ACCOUNT_DISABLED`「账号已停用，请联系机构管理员」。已发 Token 再校验到禁用：**401 `UNAUTHORIZED`**，不要 403。
- 密码错：401「手机号或密码不正确」。
- 无 LOGO 仍出海报（预研会造默认 LOGO）改为 400 `LOGO_NOT_CONFIGURED`「请联系机构配置 LOGO」（预览与下载两端点均如此）。
- 海报预览不落盘成片；下载才写正式 Poster。`previewUrl` 不得默认等于 `downloadUrl`。
- 有作品的学员禁止硬删：409「该学员已有作品，仅支持归档」。
- 重复绑定：409「已绑定」。
- 列表默认 `cursor` + `limit`（默认 20，最大 50）→ `{ items, nextCursor }`。**唯一例外**：`GET /parent/children` 直接返回 `Student[]`。
