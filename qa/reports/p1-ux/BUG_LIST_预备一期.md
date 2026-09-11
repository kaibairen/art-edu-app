# 测试预备抽检一期（整期）

范围：US-P1-01 首页公开内容。验收落在 **draft PR #12**，不另开 PR。  
对照：`qa/reports/p1-ux/PREP_SPOTCHECK.md` 整期，不逐条拆票。  
硬门禁：公开卡无点评；课程无长文。

| ID | 抽检项 | 结论 | 落点 | 备注 |
| --- | --- | --- | --- | --- |
| **P1-PREP-01** | 侧栏「首页内容」本期可进，去掉「即将开放」灰态 | **通过** | `apps/admin/src/layouts/AdminLayout.vue` | 「首页内容」「公开首页预览」均在「常用」，无 soon / 即将开放 |
| **P1-PREP-02** | 公开预览三区块固定 **轮播→课程→优秀作品** | **通过** | `apps/admin/src/views/PublicPreview.vue` | 禁止 轮播→优秀作品→课程；UI 强制该序，不跟 API 字段顺序 |
| **P1-PREP-03** | Flutter 公开首页三区块 | **不挡 Ready** | `apps/mobile/lib/src/screens/public_home_screen.dart` | 本 PR 已跟做未登录入口 + `GET /public/home`；**跟测另记**，以 Web 公开预览为准 |
| **P1-PREP-04** | 管理端「从作品选」上架 UI | **通过** | `apps/admin/src/views/home/FeaturedPanel.vue` + `P1_HOME_PATHS.adminFeaturedFromArtworks` | 对接已有 API `POST /admin/home/featured-artworks/from-artworks` |

## 硬门禁（同期自检）

- 优秀作品公开卡只展示 `imageUrl` / `title` / `studentDisplayName`，无点评表单、不渲染 `commentText`。
- 课程介绍只有标题 + 摘要（`COURSE_SUMMARY_MAX_LENGTH`），无长文 `body`。
- 主色 `#2F6FED`。
- 静态锁：`npm run test:frontend-ready`（含 PREP-01/02/04）。

## 跟测另记（不挡 #12 Ready）

- P1-PREP-03 Flutter 真机 / Web 目视跟测：登录页「先看看公开首页」→ 三区块序与空态重试。
- 管理端对真库的启停 / 排序 / from-artworks 联调目视（需 API + 种子作品）。

## 结论

预备一期 **P1-PREP-01 / 02 / 04 通过**；**P1-PREP-03 不挡本 PR Ready**。  
PR #12 保持 draft，合入经总裁办。
