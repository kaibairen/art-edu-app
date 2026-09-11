# ADR 005：JWT + RBAC

- 状态：已采纳
- 日期：2026-09-11

## 决策

- 登录签发 JWT（`sub` / `role` / `name`）。
- 全局 `JwtAuthGuard` + `RolesGuard`。
- 角色：`admin` | `teacher` | `parent`。
- **家长数据隔离不依赖前端过滤**：`AccessService` 是家长查询的唯一入口，未绑定一律 403。

## 来源

- NestJS Authentication：<https://docs.nestjs.com/security/authentication>
- NestJS Authorization：<https://docs.nestjs.com/security/authorization>
- passport-jwt：<https://www.passportjs.org/packages/passport-jwt/>

## 后果

家长端即使猜测 UUID 也无法读取他人学员/作品；e2e 覆盖越权路径。
