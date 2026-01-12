# Demo 模式设计文档 (Demo Mode)

## 1. 概述 (Overview)

Demo 模式允许潜在用户在不注册或不拥有私有服务器的情况下体验“墨梅”博客的完整功能（包括管理后台）。该模式的核心原则是**只读性**和**瞬时性**。

## 2. 核心设计原则 (Core Principles)

-   **只读性 (Read-only)**: 拦截所有可能修改数据库状态的写操作（POST, PUT, DELETE, PATCH），仅保留必要的登录和会话管理操作。
-   **瞬时性 (Ephemeral)**: 强制使用内存中的 SQLite 数据库。每次应用重启，所有数据都会重置为初始假数据。
-   **白名单机制 (Whitelist-based)**: 默认拦截所有写操作，仅对符合安全要求的特定路径（如演示账号登录）开放。

## 3. 技术实现 (Technical Implementation)

### 3.1 环境变量 (Environment Variables)

-   `NUXT_PUBLIC_DEMO_MODE=true`: 启用演示模式，同时控制前端 UI 的显示。
-   `DEMO_PASSWORD`: 演示账号的统一密码。

### 3.2 服务端中间件 (`server/middleware/demo-guard.ts`)

实施一个全局服务端中间件，执行以下逻辑：

1.  **方法检查**: 若请求方法非 `GET`，则进入拦截逻辑。
2.  **路径白名单**:
    -   `/api/auth/sign-in/email`: 允许演示用户登录。
    -   `/api/auth/sign-out`: 允许退出。
    -   `/api/auth/get-session`: 允许获取会话状态。
3.  **危险路径二次过滤**: 即使在白名单中的路径，如果涉及更改核心配置或管理员列表，也应予以封禁。
4.  **错误处理**: 拦截时返回 `403 Forbidden`，并附带明确的错误码（例如 `DEMO_MODE_RESTRICTION`）。

### 3.3 数据库策略

在 `server/database/index.ts` 中根据 `DEMO_MODE` 自动调整：

```typescript
// 当启用 Demo 模式时，强制使用内存 SQLite
if (process.env.NUXT_PUBLIC_DEMO_MODE === "true") {
    options = {
        type: "better-sqlite3",
        database: ":memory:",
        synchronize: true, // 必须同步以创建表结构
    };
}
```

### 3.4 前端实现

-   **视觉提醒**: 在 `app.vue` 或全局布局中，若 `demoMode` 为真，则在页面顶部展示一个固定的黄色 Banner。
-   **按钮反馈**: 对于被禁用的操作（如保存文章），前端应给予 Toast 提示，告知用户在演示模式下此操作不可用。

## 4. 安全考虑 (Security Considerations)

-   **API KEY**: 在 Demo 模式下，禁用 `/api/external/*` 相关的写操作。
-   **数据隔离**: 确保演示环境与生产环境的环境变量完全隔离，防止演示模式错误连接到生产数据库。
-   **限流**: 针对演示模式的写请求尝试（虽然会被拦截）仍应实施严格的 Rate Limit，防止恶意探测。

## 5. 待办事项 (Next Steps)

-   [ ] 编写核心拦截器 `demo-guard.ts`。
-   [ ] 增加假数据预填充脚本，使 Demo 环境更有吸引力。
-   [ ] 适配前端 UI 展示。
