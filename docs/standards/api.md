# 墨梅 (Momei) API 规范文档

## 1. 概述 (Overview)

本文档定义了墨梅博客后端接口的通用规范，包括响应格式、状态码、认证机制和参数校验规则。所有 API 开发必须遵循此规范。

### 1.1 HTTP 方法规范 (HTTP Methods)

为保持接口的一致性与简单性，项目仅允许使用以下四种标准 HTTP 方法：

-   **GET**: 获取资源（幂等）。
-   **POST**: 创建新资源。
-   **PUT**: 更新现有资源（完整或部分更新）。
-   **DELETE**: 删除资源。

**禁止使用 PATCH 方法**。所有的局部更新请求应统一使用 PUT 方法处理。

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

| Code | Description                |
| :--- | :------------------------- |
| 200  | 成功 (Success)             |
| 400  | 请求参数错误 (Bad Request) |
| 401  | 未授权 (Unauthorized)      |
| 403  | 禁止访问 (Forbidden)       |

### 2.2 分页响应格式 (Pagination Format)

对于列表类接口，必须使用 `paginate` 工具函数进行包装，返回统一的分页结构。

```typescript
interface PaginatedData<T> {
    items: T[]; // 数据列表 (统一使用 items 字段，禁止使用 list)
    total: number; // 总条数
    page: number; // 当前页码
    limit: number; // 每页条数
    totalPages: number; // 总页数
}

// 最终响应
interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}
```

## 3. 认证与权限规范 (Authentication & Authorization Standards)

-   **认证框架**: 必须使用 [better-auth](https://github.com/better-auth/better-auth)。
-   **Session 管理**: 必须使用基于 Cookie 的 Session 机制，以适配 SSR 环境。
-   **无状态性**: API 应尽可能保持无状态，依赖 Session Cookie 进行身份识别。
-   **权限校验**: 严禁在 API Handler 中手动处理 Session 或进行复杂的角色逻辑判断。必须优先使用 `server/utils/permission.ts` 中封装好的工具函数：
    -   `requireAuth(event)`: 校验用户是否已登录。
    -   `requireAdmin(event)`: 校验用户是否为管理员。
    -   `requireAdminOrAuthor(event)`: 校验用户是否为管理员或作者。
    -   `requireRole(event, roles)`: 校验用户是否具有指定角色（尽量少用，优先使用上述语义化函数）。

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
-   **配置**: 优先通过系统设置（数据库）配置 SMTP 服务商，或利用环境变量进行强制锁定。严禁在代码中硬编码凭据。
-   **模板**: 必须使用 HTML 邮件模板，确保跨客户端兼容性。

### 5.1 邮件国际化标准 (Email Internationalization)

-   **国际化范围**: 所有系统邮件（验证、通知、订阅等）必须支持多语言。
-   **语言获取**:
    - 如果接收者是已登录用户，优先使用其 `preferredLanguage` 字段（待实现）。
    - 如果用户未登录（如注册流程），从请求参数、Cookie 或系统默认语言中获取。
-   **文件存储**: 邮件的多语言字符串必须独立存储在 `server/utils/email/locales/` 目录下，与前端 i18n 分离。当前支持 `zh-CN`（中文）和 `en-US`（英文）。
-   **API 签名**: 所有邮件发送方法必须支持可选的 `locale` 参数，如：
    ```typescript
    sendVerificationEmail(email: string, url: string, locale?: string): Promise<void>
    ```
    不支持的语言自动降级到 `zh-CN`。
-   **文本参数**:
    邮件模板中使用 `{paramName}` 格式的占位符，支持的参数包括：`{appName}`, `{baseUrl}`, `{contactEmail}`, `{verificationCode}`, `{expiresIn}`, `{currentYear}` 等。
    参数值必须来自系统设置（`getSettings()`）或方法参数，严禁硬编码。

## 6. 文档与维护 (Documentation & Maintenance)

-   **定义位置**: 具体的 API 定义（路由、参数、响应结构）必须记载在 `docs/design/modules/*.md` 对应的模块设计文档中。
- **全局规范**: 本文档 (`standards/api.md`)仅定义通用的响应格式、错误码和开发准则，不包含具体业务接口定义。
- **数据更新模式 (Data Update Pattern)**: 在处理实体更新（PUT）或创建（POST）时，应遵循“自动同步与异常处理”原则：
    1. **普通字段**: 利用 `assignDefined` 工具函数根据 Zod Schema 自动同步经过校验的字段，禁止手动编写 `if (field !== undefined)`。
    2. **复杂字段**: 涉及哈希（Password）、文件上传、状态机转换、或需要查询数据库的关联关系（Category, Tags）时，应显式编写逻辑处理。
-   **同步更新**: 代码变更时，必须同步更新对应的模块设计文档。

## 7. 相关文档

-   [API 设计](../design/api.md)
-   [开发规范](./development.md)
