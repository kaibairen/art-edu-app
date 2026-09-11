# 美术教培 APP

> 本机用 Docker / Podman 只起 Postgres（可选 MinIO）、API 与管理端仍用 npm：见 [docs/本机Docker调试一页纸.md](docs/本机Docker调试一页纸.md)。本机能调试 ≠ `FRONTEND_READY`。

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

非本期验收：首页运营 `/admin/home-contents`、`GET /public/home`、课表。这些接口可保留，但不纳入 P0。

非目标（后续）：活动报名完整流程、推送、语音点评、短视频、数据导出、支付。

## 技术栈（已锁定）

| 端 | 选型 |
| --- | --- |
| 后端 | NestJS + TypeScript + PostgreSQL + **Prisma** |
| 对象存储 | S3 兼容抽象（本地 `local` mock；可切 MinIO/S3） |
| 管理端 | Vue 3 + TypeScript + Vite + Element Plus（业务页尚未跟 P0 契约） |
| 移动端 | Flutter（`apps/mobile`，parent/teacher 双入口；业务页尚未跟 P0 契约） |
| 鉴权 | JWT + refresh token + RBAC |
| 仓库 | npm workspaces：`apps/api` `apps/admin` `packages/shared` `packages/tokens` |

Prisma 优于 TypeORM 的说明见 [docs/adr/001-orm-prisma.md](docs/adr/001-orm-prisma.md)。

视觉 tokens 来自 design/01（主色 `#2F6FED`）：管理端 `import '@art-edu/tokens/tokens.css'` 或 `import { color } from '@art-edu/tokens'`；Flutter 引用 `lib/src/tokens.dart`。

## 仓库结构

```
apps/api          NestJS API、Prisma、e2e
apps/admin        管理端（预研 UI，未跟本期契约）
apps/mobile       Flutter 家长/教师（预研 UI，未跟本期契约）
packages/shared   角色与 P0 公共类型
packages/tokens   design/01 色板/字阶/间距
docs/api          契约变更
docs/adr          架构决策记录
docs/本机Docker调试一页纸.md
docker-compose.yml
.env.example
```

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

1. `POST /api/v1/auth/login`，body `{ "phone": "13800000000", "password": "Admin123" }`。
2. 管理端配置品牌 / 上传 LOGO（`POST /admin/brand/logo`，字段 `file`）。未配置 LOGO 时海报会 400。
3. 教师登录 → `GET /teacher/students`（按班级匹配）→ 上传小明作品（multipart：`image`，可选 `title`/`createdAt`/`courseTheme`）。
4. 家长 A `GET /parent/children` 得到数组；打开小明作品时间线。家长 B 访问小明接口返回 **404「无法查看」**。
5. 家长先打 `.../posters/preview` 换模板，再打 `.../posters` 下载成片。版式（模板、姓名、创作时间、LOGO、水印）与预览一致，但 URL 不同。

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
| `VITE_API_BASE_URL` | 管理端 API 前缀（预研 UI 仍可能指向旧路径） |

## 测试

```bash
npm run test:api    # 模板 / 分页 / 错误码 / 班级匹配
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
公开首页 → /api/v1/public/home（无鉴权，非本期验收）
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
