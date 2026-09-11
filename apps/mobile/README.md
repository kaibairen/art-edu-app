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
