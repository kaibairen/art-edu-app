# 美术教培 APP

> 本机用 Docker / Podman 只起 Postgres（可选 MinIO）、API 与管理端仍用 npm：见 [docs/本机Docker调试一页纸.md](docs/本机Docker调试一页纸.md)。  
> **FRONTEND_READY 已签发（仅 P0 + F-011）**：清单见 [FRONTEND_READY.md](FRONTEND_READY.md)。本机能起库 ≠ 体验验收完成。

面向美术培训机构的三端系统：**管理端（校长/管理员）**、**教师端**、**家长端**。

核心能力：学员美术作品存档、家校文字点评、机构宣传首页、作品海报生成与分享。家长只能查看已绑定孩子的数据，服务端强制隔离。

> **版本说明**：`v0.1.0-mvp` / PR #1（`cursor/art-edu-mvp-ec9b`）是**预研基线**，旧实现可跑但未按契约交付。当前 API 对齐 **API-MVP-P0-0.1**。破坏性变更见 [docs/api/CHANGELOG.md](docs/api/CHANGELOG.md)。

## 一期范围

P0（本期可验收）：

1. `POST /api/v1/auth/login` 使用 `{ phone, password }`，返回 access/refresh token；禁用账号登录 403 `ACCOUNT_DISABLED`；错密码 401。
2. 家长未绑定 / 教师非负责的读取一律 **404 `NOT_FOUND`「无法查看」**，不暴露「存在但无权限」。
3. 教师学员归属：`User.classNames[]` 匹配 `Student.className`。
4. 学员 CRUD；已有作品禁止硬删 → 409 `CONFLICT_STUDENT_HAS_ARTWORK`，仅支持归档。
5. 家长-学员绑定；重复绑定 409 `CONFLICT_BINDING`。
6. 作品字段：`title` / `createdAt` / `commentText` / `courseTheme` / `thumbUrl`。
7. 品牌 `GET/PUT /admin/brand`、LOGO 上传；模板 key：`simple` | `frame` | `magazine`。
8. 家长海报：`POST .../posters/preview` 只出预览；`POST .../posters` 出正式下载。无 LOGO → 400 `LOGO_NOT_CONFIGURED`；两 URL 必须不同。

P1（US-P1-01，后端已按契约落地）：公开首页 `GET /api/v1/public/home`（未登录；`brand` + `banners` + `featuredArtworks` + `courses`，仅已发布/启用）+ 管理端 `/admin/home/banners|featured-artworks|courses`（CRUD + status + reorder；优秀作品可 `from-artworks`）。公开优秀作品卡仅 `imageUrl`/`title`/`studentDisplayName`，禁止点评与私人档案。课表 / 考勤 / 活动报名仍不做。

非目标（后续）：活动报名完整流程、推送、语音点评、短视频、数据导出、支付。

## 技术栈（已锁定）

| 端 | 选型 |
| --- | --- |
| 后端 | NestJS + TypeScript + PostgreSQL + **Prisma** |
| 对象存储 | S3 兼容抽象（本地 `local` mock；可切 MinIO/S3） |
| 管理端 | Vue 3 + TypeScript + Vite + Element Plus（P0 业务页已对齐 `/api/v1`） |
| 移动端 | Flutter（`apps/mobile`，parent/teacher 双入口；P0 业务页已对齐 `/api/v1`） |
| 鉴权 | JWT + refresh token + RBAC |
| 仓库 | npm workspaces：`apps/api` `apps/admin` `packages/shared` `packages/tokens` `packages/api-types` |

Prisma 优于 TypeORM 的说明见 [docs/adr/001-orm-prisma.md](docs/adr/001-orm-prisma.md)。

视觉 tokens 来自 design/01（主色 `#2F6FED`）：管理端 `import '@art-edu/tokens/tokens.css'` 或 `import { color } from '@art-edu/tokens'`；Flutter 引用 `lib/src/tokens.dart`。

## 仓库结构

```
apps/api          NestJS API、Prisma、e2e
apps/admin        管理端（P0 业务页：账号 / 学员绑定 / 品牌模板）
apps/mobile       Flutter 家长/教师（P0：上传点评 / 多孩时间线 / 海报三分离）
FRONTEND_READY.md P0 前端可实现清单
packages/shared   角色与 P0 公共类型
packages/tokens   design/01 色板/字阶/间距
packages/api-types  P0 /api/v1 DTO + 错误码（Mock 骨架）
docs/api          契约变更
docs/adr          架构决策记录
docs/contracts    P0 OpenAPI（Prism / MSW）+ P1 US-P1-01 `openapi-p1-home.yaml`
docs/本机Docker调试一页纸.md
docker-compose.yml
.env.example
```

## P0 业务页与 Mock

业务页对接真后端 `/api/v1`（`@art-edu/shared` + `apps/admin/src/api/v1.ts` / `apps/mobile/lib/src/api_client.dart`）。

Prism Mock 仍可用（字段名偏 OpenAPI 旧稿，仅作对照）：

```bash
docker compose --profile mock up prism
# 或
npx --yes @stoplight/prism-cli@5 mock docs/contracts/openapi-p0.yaml -p 4010 -h 0.0.0.0
```

- 管理端 Mock client：`apps/admin/src/api/p0`（`VITE_P0_API_BASE_URL`）
- 移动端 Mock 桩：`apps/mobile/lib/src/p0/`
- 海报两接口 URL 禁止相同：`previewPoster` vs `downloadPoster`

硬约束自检：`npm run test:frontend-ready`。说明见 [docs/contracts/README.md](docs/contracts/README.md)。

## 本地启动

一页纸（Docker **或** Podman、同一 `DATABASE_URL`、常见坑）：[docs/本机Docker调试一页纸.md](docs/本机Docker调试一页纸.md)。

### 1. 环境要求

- Node.js 20+
- PostgreSQL 16（推荐 Docker 或 Podman；二选一即可）
- 可选：Flutter 3.22+（跑移动端）
- 可选：MinIO（`STORAGE_DRIVER=s3`）

本机无容器引擎时，安装系统 PostgreSQL，并保证 `DATABASE_URL` 可连即可。

### 2. 启动数据库

```bash
docker compose up -d postgres
# 或 Podman：
podman compose up -d postgres
```

使用 MinIO 时：

```bash
docker compose --profile s3 up -d
# 或：podman compose --profile s3 up -d
# 将 .env 中 STORAGE_DRIVER 改为 s3，并核对 S3_* 变量
```

### 3. 安装与迁移

```bash
cp .env.example .env
cp .env.example apps/api/.env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

从预研库升级时，`db:migrate` 会把 `User.name`→`displayName`、Artwork `theme/createdOn/textComment`→`title/createdAt/commentText`、模板 key、以及 TeacherStudent 回填为 `classNames`/`className`。

### 4. 启动服务

```bash
# 终端 1：API  http://localhost:3000/api/v1
npm run dev:api

# 终端 2：管理端 http://localhost:5173
npm run dev:admin
```

Swagger：<http://localhost:3000/api/v1/docs>

移动端见 [apps/mobile/README.md](apps/mobile/README.md)。

### 演示账号

| 角色 | 手机号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 管理员 | 13800000000 | Admin123 | 管理端 |
| 教师 | 13800000001 | Teacher123 | `classNames=['创意水彩班']`，可见小明、小红 |
| 家长 A | 13800000002 | Parent123 | 仅小明 |
| 家长 B | 13800000003 | Parent123 | 仅小红 |

### 主链路演示

1. 管理端登录（手机号 `13800000000` / `Admin123`）→ 账号管理（教师 `classNames`）/ 学员绑定 / 品牌 LOGO 与模板（简约/画框/杂志）。未配置 LOGO 时海报 400。
2. Flutter 教师端登录 → 按班级看学员 → 上传图片并写文字点评。无班级时提示「请联系管理员分配班级」。
3. Flutter 家长端多孩列表打开小明时间线与详情。家长 B 访问小明接口返回 **404「无法查看」**。
4. 家长海报：预览页只打 `…/posters/preview`，主按钮打 `…/posters` 后进入结果页。`previewUrl` ≠ `downloadUrl`。

## 环境变量

完整列表见 [.env.example](.env.example)。关键项：

| 变量 | 含义 |
| --- | --- |
| `DATABASE_URL` | Prisma 连接串 |
| `JWT_SECRET` | JWT 密钥 |
| `JWT_EXPIRES_IN` | access token 有效期（如 `2h`、`7d`） |
| `STORAGE_DRIVER` | `local` 或 `s3` |
| `STORAGE_LOCAL_DIR` / `STORAGE_PUBLIC_BASE_URL` | 本地存储与对外 URL |
| `S3_ENDPOINT` `S3_BUCKET` `S3_ACCESS_KEY` `S3_SECRET_KEY` | S3/MinIO |
| `VITE_API_BASE_URL` | 管理端 API 前缀，默认 `http://localhost:3000/api/v1` |
| `VITE_P0_API_BASE_URL` | Prism Mock client 前缀 |

## 测试

```bash
npm run test:api    # 模板 / 分页 / 错误码 / 班级匹配
npm run test:p0-types  # P0 api-types 示例断言（Mock 骨架）
# 默认连 artedu_test，避免清空演示库；请先创建该库或自行设置 DATABASE_URL
createdb -U artedu artedu_test 2>/dev/null || true
npm run test:e2e    # 登录、越权 404、绑定/删除 409、无 LOGO 400、预览/下载分端点、儿童数组
```

e2e 会清空所连库的业务表。演示库请用 `.env` 中的 `artedu`，测试请用 `artedu_test`。

## 架构要点

```
家长请求 → JwtAuthGuard → RolesGuard(parent)
         → AccessService.assertParentOwnsStudent/Artwork
         → 未绑定返回 404「无法查看」
教师     → classNames[] 匹配 Student.className，否则 404「无法查看」
教师上传 → Storage.putObject + thumb → Artwork
海报     → 无 LOGO 则 400；preview 不落盘成片；download 才成片；两 URL 不同
公开首页 → /api/v1/public/home（无鉴权；仅已发布/启用；无 LOGO 不阻断）
```

对象存储对业务透明，见 [docs/adr/003-storage-s3-abstraction.md](docs/adr/003-storage-s3-abstraction.md)。

## 参考文档（遇阻查阅）

- NestJS Auth：https://docs.nestjs.com/security/authentication
- NestJS + Prisma：https://docs.nestjs.com/recipes/prisma
- Prisma Migrate：https://www.prisma.io/docs/orm/prisma-migrate
- Vue Router：https://router.vuejs.org/
- Element Plus：https://element-plus.org/zh-CN/
- Flutter flavors：https://docs.flutter.dev/deployment/flavors
- AWS SDK S3：https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/

## 许可

仅用于机构内部交付演示，未声明开源许可证。
