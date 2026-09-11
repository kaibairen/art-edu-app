# ADR 006：Flutter 单工程双入口

- 状态：已采纳
- 日期：2026-09-11

## 决策

一个 `apps/mobile` 工程，用 `lib/main_parent.dart` 与 `lib/main_teacher.dart`（或 `--dart-define=APP_ROLE`）区分角色，而不是拆两个独立 App。

## 来源

- Flutter flavors：<https://docs.flutter.dev/deployment/flavors>
- `--dart-define`：<https://docs.flutter.dev/deployment/flavors#flavor-specific-dart-entry-points>

## 理由

一期家长/教师界面高度同源（登录、学员列表、时间线、海报）。双入口共享 API 客户端，减少重复。原生 store 多包名可在二期再加 flavor 配置。
