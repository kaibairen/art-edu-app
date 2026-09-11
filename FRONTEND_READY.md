# FRONTEND_READY（已签发 · P0）

本文件是 P0 业务前端可实现清单。签发范围：**仅 P0 + F-011**。  
管理端 Vue3 + Flutter 教师/家长按本清单改造预研页，对接 main 上真后端 `/api/v1`（也可用 `packages/api-types` + Prism Mock 做对照）。

> 预研基线（PR #1）可跑但未按契约交付。本里程碑把业务页对齐契约与 design/01。

## 设计硬约束

- 品牌色 `#2F6FED`（`packages/tokens` / `apps/mobile/lib/src/tokens.dart`）
- 海报模板对外名：**简约 / 画框 / 杂志**（key：`simple` | `frame` | `magazine`）
- **预览 ≠ 下载 ≠ 结果页**：`previewUrl` 禁止当作下载地址，且不得等于 `downloadUrl`
- 越权读：HTTP 404 `NOT_FOUND`，文案「无法查看」

## 可实现清单

| 序 | ID | 端 | 内容 | 实现落点 |
| --- | --- | --- | --- | --- |
| 1 | US-P0-01 | 三端 | 登录与三角色壳；未登录进受保护路由跳登录 | 管理端 `LoginView` + `AdminLayout`；Flutter `LoginScreen` + 教师/家长 Home 壳 |
| 2 | US-P0-03 | 管理端 | 账号列表/新建/启停、学员 CRUD、家长↔学员绑定；`CONFLICT_BINDING` / `CONFLICT_STUDENT_HAS_ARTWORK` / `archived` | `UsersView` `StudentsView` |
| 2a | F-011 / P0.1 | 管理端+教师 | 教师 `classNames: string[]` 管理端可编辑；教师空态「请联系管理员分配班级」 | 账号 `POST/PATCH /admin/accounts` 已接真后端该字段（不依赖 OpenAPI）。教师 Home 空列表文案见上。 [docs/P0.1-教师班级归属小补.md](docs/P0.1-教师班级归属小补.md) |
| 3 | US-P0-07 | 管理端 | 品牌 LOGO / 水印 / 模板；未配置 LOGO 态；`POST /admin/brand/logo` 字段 `file` | `SettingsView` `TemplatesView` |
| 4 | US-P0-04 | 教师端 | 上传图片 + 文字点评 | `UploadScreen`（multipart `title`/`createdAt`/`courseTheme`）+ `POST …/comments` |
| 5 | US-P0-05 | 家长端 | 多孩列表 + 时间线 + 详情 | `HomeScreen` `TimelineScreen` `ArtworkScreen` |
| 6 | US-P0-06 | 家长端 | 海报 preview / download / 结果页三分离 | `PosterPreviewScreen` `PosterResultScreen` |

## 不做（P1 / P2 / Out）

导出、课表业务、首页完整运营、语音/推送/报名/视频。  
`/home` 与公开首页预览仍可打开，**不纳入本期验收**。

## 硬约束自检

```bash
npm run test:frontend-ready
```

本地 npm / Flutter 调试（Docker 或 Podman 只起库）：[docs/本机Docker调试一页纸.md](docs/本机Docker调试一页纸.md)。
