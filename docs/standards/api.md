# 墨梅 (Momei) API 规范文档

## 1. 概述 (Overview)

本文档定义了墨梅博客后端接口的通用规范，包括响应格式、状态码、认证机制和参数校验规则。所有 API 开发必须遵循此规范。

## 2. 统一响应格式 (Unified Response Format)

所有 API 接口（除特定流式接口或文件下载外）必须遵循统一的 JSON 响应格式。

```typescript
interface ApiResponse<T = any> {
    code: number; // 业务状态码，200 表示成功，非 200 表示异常
    message: string; // 状态描述或错误信息
    data?: T; // 成功时返回的数据
}
```

### 2.1 状态码定义 (Status Codes)

| Code | Description                            |
| :--- | :------------------------------------- |
| 200  | 成功 (Success)                         |
| 400  | 请求参数错误 (Bad Request)             |
| 401  | 未授权 (Unauthorized)                  |
| 403  | 禁止访问 (Forbidden)                   |
| 404  | 资源未找到 (Not Found)                 |
| 500  | 服务器内部错误 (Internal Server Error) |

## 3. 认证与权限规范 (Authentication & Authorization Standards)

-   **认证框架**: 必须使用 [better-auth](https://github.com/better-auth/better-auth)。
-   **Session 管理**: 必须使用基于 Cookie 的 Session 机制，以适配 SSR 环境。
-   **无状态性**: API 应尽可能保持无状态，依赖 Session Cookie 进行身份识别。

## 4. 参数校验规范 (Validation Standards)

所有输入参数（Query, Body, Params）必须使用 **Zod** schema 进行定义和校验。

```typescript
// 示例：创建文章校验
const createPostSchema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
});
```

## 5. 邮件服务规范 (Email Service Standards)

-   **服务提供商**: 使用 **Nodemailer** 作为统一的邮件发送接口。
-   **配置**: 必须通过环境变量配置 SMTP 服务商，禁止在代码中硬编码凭据。
-   **模板**: 必须使用 HTML 邮件模板，确保跨客户端兼容性。

## 6. 文档与维护 (Documentation & Maintenance)

-   **定义位置**: 具体的 API 定义（路由、参数、响应结构）必须记载在 `docs/design/modules/*.md` 对应的模块设计文档中。
-   **全局规范**: 本文档 (`standards/api.md`) 仅定义通用的响应格式、错误码和开发准则，不包含具体业务接口定义。
-   **同步更新**: 代码变更时，必须同步更新对应的模块设计文档。

## 7. 相关文档

-   [API 设计](../design/api.md)
-   [开发规范](./development.md)
