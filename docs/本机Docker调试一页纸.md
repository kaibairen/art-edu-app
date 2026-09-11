# 本机 Docker / Podman 调试一页纸

用 **Docker 或 Podman** 只起依赖（Postgres，可选 MinIO），**API / Admin 仍在宿主机用 npm 跑**。容器引擎不同，`.env` 里的 `DATABASE_URL` 相同。

> 这里只保证库起来、种子账号能登录、接口能打。P0 业务前端清单见 [FRONTEND_READY.md](../FRONTEND_READY.md)，不要把「本机 compose 绿了」写成体验验收完成。

## 分工

| 谁跑 | 跑什么 | 不跑什么 |
| --- | --- | --- |
| Docker **或** Podman | PostgreSQL 16（`artedu`），可选 MinIO | 不要把 API / Admin 打进容器 |
| 宿主机 npm | `dev:api`、`dev:admin`、migrate、seed | 不要改 `DATABASE_URL` 主机名去迁就引擎 |

默认连接串（与 `.env.example`、`docker-compose.yml` 对齐）：

```text
DATABASE_URL=postgresql://artedu:artedu@localhost:5432/artedu?schema=public
```

宿主机连的是映射口 `localhost:5432`，不是容器内部主机名。

## 1. 只起 Postgres

任选一列，效果等价。

| Docker | Podman（compose） | Podman（无 compose 插件时） |
| --- | --- | --- |
| `docker compose up -d postgres` | `podman compose up -d postgres` | 见下方 `podman run` |

```bash
# Docker
docker compose up -d postgres

# Podman（v4+ 多带 compose 子命令；旧环境可用 podman-compose）
podman compose up -d postgres
# 或
podman-compose up -d postgres
```

`podman run` 对齐 compose 的库名 / 账号 / 端口 / 卷：

```bash
podman run -d --name art-edu-postgres --replace \
  -e POSTGRES_USER=artedu \
  -e POSTGRES_PASSWORD=artedu \
  -e POSTGRES_DB=artedu \
  -p 5432:5432 \
  -v art_edu_pg_data:/var/lib/postgresql/data \
  --health-cmd "pg_isready -U artedu -d artedu" \
  --health-interval 5s --health-timeout 5s --health-retries 10 \
  docker.io/postgres:16-alpine
```

就绪检查（二选一）：

```bash
docker compose exec postgres pg_isready -U artedu -d artedu
podman exec art-edu-postgres pg_isready -U artedu -d artedu
```

## 2. 可选 MinIO（对象存储）

默认 `STORAGE_DRIVER=local`，**不必起 MinIO**。要走 S3 兼容时：

| Docker | Podman compose | Podman run |
| --- | --- | --- |
| `docker compose --profile s3 up -d` | `podman compose --profile s3 up -d` | 见下 |

```bash
podman run -d --name art-edu-minio --replace \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 -p 9001:9001 \
  -v art_edu_minio_data:/data \
  docker.io/minio/minio:latest \
  server /data --console-address ":9001"
```

然后改 `.env` / `apps/api/.env`：`STORAGE_DRIVER=s3`，并核对 `S3_*`（endpoint `http://localhost:9000`，账号口令 `minioadmin`）。控制台：<http://localhost:9001>。首次需自建 bucket `art-edu`（或按你改过的 `S3_BUCKET`）。

## 3. 宿主机：安装、迁移、种子、起服务

容器起来之后，**不要** `compose up` API。在仓库根目录：

```bash
cp .env.example .env
cp .env.example apps/api/.env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

```bash
# 终端 1  API   http://localhost:3000/api/v1    Swagger /api/v1/docs
npm run dev:api

# 终端 2  管理端 http://localhost:5173
npm run dev:admin
```

登录用 `{ "phone", "password" }`（不要再发 `account`）。冒烟：

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","password":"Admin123"}'
```

移动端仍按 [apps/mobile/README.md](../apps/mobile/README.md)；Android 模拟器访问宿主机 API 用 `10.0.2.2`，前缀同样是 `/api/v1`。

## 演示账号（与 README / `prisma/seed.ts` 一致）

| 角色 | 手机号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 管理员 | 13800000000 | Admin123 | 管理端 |
| 教师 | 13800000001 | Teacher123 | `classNames=['创意水彩班']`，可见小明、小红 |
| 家长 A | 13800000002 | Parent123 | 仅小明 |
| 家长 B | 13800000003 | Parent123 | 仅小红 |

未 seed 时这些号不存在。改过库或空库请再跑 `npm run db:seed`。

## 常见坑

### 5432 被占

本机若已有系统 PostgreSQL / 另一个容器占着 `5432`，compose / `podman run -p 5432:5432` 会失败或连到**另一套库**。

```bash
ss -ltnp | grep 5432 || lsof -iTCP:5432 -sTCP:LISTEN
```

处理：停掉占用进程，或改映射（如 `5433:5432`）并同步改 `DATABASE_URL` 端口。不要只改容器不改 `.env`。

### `artedu` ≠ `artedu_test`

| 库 | 用途 |
| --- | --- |
| `artedu` | 演示 / 本机调试（`.env` 默认） |
| `artedu_test` | `npm run test:e2e` 默认；**会清空业务表** |

compose 只创建 `artedu`。跑 e2e 前要另建测试库：

```bash
# Docker
docker compose exec postgres psql -U artedu -d artedu -c 'CREATE DATABASE artedu_test;'

# Podman
podman exec art-edu-postgres psql -U artedu -d artedu -c 'CREATE DATABASE artedu_test;'
```

或：`createdb -h localhost -U artedu artedu_test`（需本机 `psql` 客户端）。  
**禁止**把 e2e 指到演示库 `artedu`。

### 忘了 seed / 迁错库

- 登录 401、用户表空：多半没 `db:seed`，或 `DATABASE_URL` 指到空实例。
- migrate 成功但管理端没数据：确认 `apps/api/.env` 与根目录 `.env` 是同一条 URL。
- 演示数据被清空：刚才的 e2e 连了 `artedu` 而不是 `artedu_test`。

### Podman rootless

- 镜像名加仓库前缀更稳：`docker.io/postgres:16-alpine`（rootless 默认不一定搜 Docker Hub）。
- 无 `podman compose` 时用 `podman-compose` 或上面的 `podman run`，不要混用两套卷名。
- rootless 映射到特权端口会失败；`5432` 一般可以，若被策略拦住，改成 `5433:5432` 并改 URL。
- 卷权限异常时看是否用了另一用户的 rootful 卷；`podman unshare` / 清掉同名 volume 后再起。
- 个别 rootless 栈上 `localhost` 与 `127.0.0.1` 不一致：`.env` 可改成 `127.0.0.1`，与 CI 一致。
- macOS / Windows 的 Podman Machine：端口是映射到**虚拟机**再转到宿主机；连不上时先 `podman machine start`，再确认 `podman port art-edu-postgres`。

## 停掉依赖

```bash
docker compose down          # 保留 volume
podman compose down
# 或
podman stop art-edu-postgres art-edu-minio
```

加 `-v` / `podman volume rm art_edu_pg_data` 会删库，演示账号需重新 migrate + seed。

## 自检清单（本机依赖）

1. `pg_isready` 成功，`DATABASE_URL` 指向 `artedu`。
2. `db:migrate` + `db:seed` 无报错。
3. `npm run dev:api` 后 Swagger 在 `/api/v1/docs`；`POST /api/v1/auth/login` 用上表手机号能拿到 `accessToken`。
4. 需要 e2e 时另有 `artedu_test`，且未覆盖演示库。

以上全过 = **本机依赖与后端调试通路可用**。P0 前端清单与硬约束见 [FRONTEND_READY.md](../FRONTEND_READY.md)，另跑 `npm run test:frontend-ready`。
