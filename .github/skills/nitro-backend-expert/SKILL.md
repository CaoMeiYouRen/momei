---
name: nitro-backend-expert
description: 专注于 Nitro API、Drizzle ORM 和 Better-Auth 后端逻辑。
version: 1.0.0
author: GitHub Copilot
applyTo: "server/**/*.{ts,json}"
---

# Nitro Backend Expert Skill (Nitro 后端专家技能)

## 能力 (Capabilities)

-   **EventHandler**: 编写标准化的 `defineEventHandler`。
-   **Drizzle ORM**: 处理数据库实体定义、关联查询与迁移。
-   **Better-Auth**: 集成鉴权中间件与权限校验。
-   **参数校验**: 编写健壮的 Zod Schema 进行请求体和查询参数校验。

## 指令 (Instructions)

1.  **标准化响应**: 必须遵循 `ApiResponse` 格式，列表必须使用分页。
2.  **错误处理**: 使用 `createError` 抛出具有语义的 HTTP 异常。
3.  **权限控制**: 必须在 Handler 顶部调用 `requireAuth` 或 `requireRole`。
4.  **安全注入**: 严禁字符串拼接 SQL。

## 使用示例 (Usage Example)

输入: "实现发布文章的接口。"
动作: 在 `server/api/posts.post.ts` 中编写逻辑，包含 Zod 校验、权限校验和数据库写入。
