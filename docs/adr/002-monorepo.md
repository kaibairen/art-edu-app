# ADR 002：npm workspaces 单体仓库

- 状态：已采纳
- 日期：2026-09-11

## 决策

采用 npm workspaces：`apps/api`、`apps/admin`、`packages/shared`；Flutter 独立于 `apps/mobile`（不进入 Node workspace）。

## 理由

- Node 两端共享 `@art-edu/shared` 角色与 DTO 常量。
- Flutter 官方工程模型与 pub 生态独立，硬塞进 npm workspace 无收益（参见 <https://docs.flutter.dev/development/packages-and-plugins>）。
- 一期团队规模小，单仓即可对齐接口契约。
