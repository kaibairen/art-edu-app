# 美术教培 APP（一期 MVP）

面向美术培训机构的三端系统：**管理端（校长/管理员）**、**教师端**、**家长端**。

核心能力：学员美术作品存档、家校文字点评、机构宣传首页、作品海报生成与分享。家长只能查看已绑定孩子的数据，服务端强制隔离。

## 一期范围

已交付：

1. 账号登录；管理端创建教师/家长；JWT + RBAC（`admin` | `teacher` | `parent`）；家长-学员一对多绑定。
2. 家长查询一律按绑定过滤；e2e 证明越权 403。
3. 学员档案 + 作品（图片 URL、主题、创作时间、文字点评）时间线。
4. 教师负责学员列表、上传图片、文字点评；语音/视频点评字段占位。
5. 服务端 3 套海报模板（classic / gallery / festival），自动姓名+创作时间，强制 LOGO + 可配置水印。
6. 管理端：用户、LOGO/水印、海报模板元数据、首页内容 CRUD。
7. 公开首页 API：`GET /api/public/home`。

非目标（二期）：活动报名完整流程、推送、语音点评完整实现、短视频完整链路、数据导出、支付。

## 技术栈（已锁定）

| 端 | 选型 |
| --- | --- |
| 后端 | NestJS + TypeScript + PostgreSQL + **Prisma** |
| 对象存储 | S3 兼容抽象（本地 `local` mock；可切 MinIO/S3） |
| 管理端 | Vue 3 + TypeScript + Vite + Element Plus |
| 移动端 | Flutter（`apps/mobile`，parent/teacher 双入口） |
| 鉴权 | JWT + RBAC |
| 仓库 | npm workspaces：`apps/api` `apps/admin` `packages/shared` |

Prisma 优于 TypeORM 的说明见 [docs/adr/001-orm-prisma.md](docs/adr/001-orm-prisma.md)。

## 仓库结构

```
apps/api          NestJS API、Prisma、e2e
apps/admin        管理端
apps/mobile       Flutter 家长/教师
packages/shared   一期 MVP 运行时类型
packages/api-types  P0 /api/v1 DTO + 错误码（Mock 骨架）
docs/adr          架构决策记录
docs/contracts    P0 OpenAPI（Prism / MSW）
docker-compose.yml
.env.example
```

## P0 Mock 骨架（业务页冻结）

**FRONTEND_READY 暂停。** 只允许对接 Mock 的类型与轻量 client，禁止新增/扩展业务页 CRUD UI，也不验收体验。

契约：[docs/contracts/openapi-p0.yaml](docs/contracts/openapi-p0.yaml)。仓内无 `backend/openapi-p0.yaml`。

- Base `http://localhost:4010/api/v1`；`Authorization: Bearer {accessToken}`
- 成功直接返回资源；错误 `{ code, message, details? }`
- 定稿错误码见 `API_ERROR_DEFS`：`CONFLICT_BINDING` 409「已绑定」；`CONFLICT_STUDENT_HAS_ARTWORK` 409（`Student.status` = `active` | `archived`）；登录 `ACCOUNT_DISABLED` 403，已发 Token → 401 `UNAUTHORIZED`
- 海报拆成两个接口，URL 禁止相同：
  - `POST /parent/artworks/{id}/posters/preview` → `{ previewUrl, templateKey }`（`previewPoster`）
  - `POST /parent/artworks/{id}/posters` → `{ downloadUrl, templateKey }`（`downloadPoster`）
  - Mock 示例：`…-preview.png` vs `….png`

启动 Prism：

```bash
docker compose --profile mock up prism
# 或
npx --yes @stoplight/prism-cli@5 mock docs/contracts/openapi-p0.yaml -p 4010 -h 0.0.0.0
```

管理端 P0 client：`apps/admin/src/api/p0`（`VITE_P0_API_BASE_URL` 可切换 base）。现有视图仍走 `apps/admin/src/api/http.ts` + `VITE_API_BASE_URL`。

移动端桩：`apps/mobile/lib/src/p0/`，接法见 [apps/mobile/README.md](apps/mobile/README.md)。不要改现有 Screen。

更完整的 Prism / MSW 说明：[docs/contracts/README.md](docs/contracts/README.md)。

## 本地启动

### 1. 环境要求

- Node.js 20+
- PostgreSQL 16（推荐 Docker）
- 可选：Flutter 3.22+（跑移动端）
- 可选：MinIO（`STORAGE_DRIVER=s3`）

本机无 Docker 时，安装系统 PostgreSQL，并保证 `DATABASE_URL` 可连即可。

### 2. 启动数据库

```bash
docker compose up -d postgres
```

使用 MinIO 时：

```bash
docker compose --profile s3 up -d
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

### 4. 启动服务

```bash
# 终端 1：API  http://localhost:3000/api
npm run dev:api

# 终端 2：管理端 http://localhost:5173
npm run dev:admin
```

Swagger：<http://localhost:3000/api/docs>

移动端见 [apps/mobile/README.md](apps/mobile/README.md)。

### 演示账号

| 角色 | 手机号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 管理员 | 13800000000 | Admin123 | 管理端 |
| 教师 | 13800000001 | Teacher123 | 负责小明、小红 |
| 家长 A | 13800000002 | Parent123 | 仅小明 |
| 家长 B | 13800000003 | Parent123 | 仅小红 |

### 主链路演示

1. 管理端登录 → 用户管理 / 学员绑定 / 修改 LOGO 与水印 / 编辑首页。
2. 教师端登录 → 上传小明作品并写文字点评。
3. 家长 A 打开小明时间线可见新作品；家长 B 访问小明接口返回 403。
4. 在作品详情选择 classic / gallery / festival 生成海报（含姓名、日期、LOGO、水印）。
5. 未登录访问 `GET /api/public/home` 查看宣传首页。

## 环境变量

完整列表见 [.env.example](.env.example)。关键项：

| 变量 | 含义 |
| --- | --- |
| `DATABASE_URL` | Prisma 连接串 |
| `JWT_SECRET` | JWT 密钥 |
| `STORAGE_DRIVER` | `local` 或 `s3` |
| `STORAGE_LOCAL_DIR` / `STORAGE_PUBLIC_BASE_URL` | 本地存储与对外 URL |
| `S3_ENDPOINT` `S3_BUCKET` `S3_ACCESS_KEY` `S3_SECRET_KEY` | S3/MinIO |
| `VITE_API_BASE_URL` | 管理端 API 前缀 |

## 测试

```bash
npm run test:api    # 海报模板单测
# 默认连 artedu_test，避免清空演示库；请先创建该库或自行设置 DATABASE_URL
createdb -U artedu artedu_test 2>/dev/null || true
npm run test:e2e    # 越权 / 上传可见 / 三模板海报 / 管理端设置
```

e2e 会清空所连库的业务表。演示库请用 `.env` 中的 `artedu`，测试请用 `artedu_test`。

e2e 覆盖验收项：家长越权失败、教师上传家长可见、三模板海报 recipe 含姓名时间 LOGO 水印、管理端可改水印与首页。

## 架构要点

```
家长请求 → JwtAuthGuard → RolesGuard(parent)
         → AccessService.assertParentOwnsStudent/Artwork
         → 仅返回绑定数据，否则 403
教师上传 → 校验 TeacherStudent → Storage.putObject → Artwork
海报     → sharp(SVG) 强制 overlays → Storage.putObject → Poster
公开首页 → /api/public/home（无鉴权，仅 published 内容）
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
