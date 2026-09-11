# 美术教培移动端（家长 / 教师）

共用一套 Flutter 代码，通过入口文件区分角色：

| 角色 | 入口 | 演示账号 |
| --- | --- | --- |
| 家长 | `lib/main_parent.dart` | `13800000002` / `Parent123` |
| 教师 | `lib/main_teacher.dart` | `13800000001` / `Teacher123` |

也可使用默认入口并传入 `--dart-define=APP_ROLE=parent|teacher`。

## 首次生成本地工程文件

本目录只提交业务 Dart 代码。克隆后需用 Flutter SDK 生成平台工程：

```bash
# 来源：https://docs.flutter.dev/get-started/install
cd apps/mobile
flutter create --project-name art_edu_mobile --org com.artedu .
```

`flutter create` 不会覆盖已有 `lib/` 源码（见官方 `flutter create` 帮助说明）。

## 运行

Android 模拟器访问宿主机 API 请用 `10.0.2.2`：

```bash
flutter run -t lib/main_parent.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

flutter run -t lib/main_teacher.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

iOS / 桌面 / Chrome：

```bash
flutter run -d chrome -t lib/main_parent.dart \
  --dart-define=API_BASE_URL=http://127.0.0.1:3000/api
```

家长端查询一律走 `/parent/*`，服务端按绑定强制过滤；未绑定孩子会返回 403。

品牌色与字阶来自 design/01，见 `lib/src/tokens.dart`（与 `@art-edu/tokens` 对齐，主色 `#2F6FED`）。

## P0 Mock client 桩（业务页冻结）

FRONTEND_READY 暂停。新增的 `lib/src/p0/` **不要**接到现有 Screen。

默认 base：`http://127.0.0.1:4010/api/v1`（Prism / MSW）。

```bash
# 仅验证 client 能打到 Mock，不改 UI
# Android 模拟器：
# --dart-define=P0_API_BASE_URL=http://10.0.2.2:4010/api/v1
```

海报是两个接口，方法分开：

| Client | Path | 响应 |
| --- | --- | --- |
| `previewPoster` | `POST /parent/artworks/{id}/posters/preview` | `{ previewUrl, templateKey }` |
| `downloadPoster` | `POST /parent/artworks/{id}/posters` | `{ downloadUrl, templateKey }` |

两 URL 禁止相同。Mock 示例：`…-preview.png` vs `….png`。

接 Mock 的步骤：起 Prism（见仓库 [docs/contracts/README.md](../../docs/contracts/README.md)），在调试代码里 `P0ApiClient(baseUrl: …)` 调用上述方法。现有 `ApiClient` / 各 Screen 保持一期 `/api`。
