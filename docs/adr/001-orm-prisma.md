# ADR 001：选用 Prisma 而非 TypeORM

- 状态：已采纳
- 日期：2026-09-11

## 背景

一期需要 PostgreSQL 关系模型（用户、学员、家长绑定、作品、海报、首页内容），并尽快提供可重复的迁移与种子数据。

## 决策

使用 **Prisma 6 + PostgreSQL**，放弃 TypeORM。

## 理由

1. Schema 即文档，迁移可检入（`prisma/migrations`）。
2. 类型生成与 NestJS 服务层契合，减少手写实体样板。
3. 官方文档对 Nest 集成路径清晰：<https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nestjs-prisma> 以及 NestJS 文档 <https://docs.nestjs.com/recipes/prisma>。
4. 种子脚本与 e2e 重置成本低。

## 后果

- 运行前必须 `prisma generate` + `prisma migrate deploy`。
- 复杂原生 SQL 较少；一期查询以绑定过滤为主，Prisma API 足够。
