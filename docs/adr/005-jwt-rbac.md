# ADR 005：JWT + RBAC

- 状态：已采纳
- 日期：2026-09-11

## 决策

- 登录签发 JWT（`sub` / `role` / `displayName`）与 refresh token。
- 全局 `JwtAuthGuard` + `RolesGuard`。
- 角色：`admin` | `teacher` | `parent`。
- **家长/教师数据隔离不依赖前端过滤**：`AccessService` 是查询唯一入口。
- P0 契约（API-MVP-P0-0.1）将越权读从预研的 403 改为 **404 `NOT_FOUND`「无法查看」**，详见 [docs/api/CHANGELOG.md](../api/CHANGELOG.md)。

## 来源

- NestJS Authentication：<https://docs.nestjs.com/security/authentication>
- NestJS Authorization：<https://docs.nestjs.com/security/authorization>
- passport-jwt：<https://www.passportjs.org/packages/passport-jwt/>

## 后果

家长端即使猜测 UUID 也无法读取他人学员/作品；e2e 覆盖越权路径。
