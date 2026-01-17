# Demo 模式设计文档 (Demo Mode)

## 1. 概述 (Overview)

Demo 模式允许潜在用户在不注册或不拥有私有服务器的情况下体验“墨梅”博客的完整功能（包括管理后台）。该模式的核心原则是**只读性**和**瞬时性**。

## 2. 核心设计原则 (Core Principles)

-   **全功能体验 (Full Feature Experience)**: 用户可以执行发布、修改、删除等操作，但所有修改仅在内存数据库中生效。
-   **瞬时性 (Ephemeral)**: 强制使用内存中的 SQLite 数据库。由于内存数据库的特性，数据在应用重启或容器回收后会重置为初始假数据。
-   **AI 的“确定性响应” (Mock AI)**: AI 功能在 Demo 模式下不进行实际 API 调用（节省成本），而是通过匹配输入内容或随机返回预设的写死内容，但保留完整的加载流、打字机动画等交互流程。
-   **新手引导 (Onboarding)**: 集成步进式交互引导，引导用户从登录到发布文章，重点展示 AI 辅助创作功能。

## 3. 技术实现 (Technical Implementation)

### 3.1 环境变量 (Environment Variables)

-   `NUXT_PUBLIC_DEMO_MODE=true`: 启用演示模式，同时控制前端 UI 的显示。
-   `DEMO_PASSWORD`: 演示账号的统一密码。
-   `DEMO_USER_EMAIL`: 预设的演示账号邮箱。

### 3.2 模拟 AI 逻辑 (Mock AI Service)

在服务端 API 层拦截 AI 请求：

1.  当检测到 `DEMO_MODE` 时，`AIProvider` 切换到 `MockProvider`。
2.  `MockProvider` 返回预定义的、高质量的博文摘要、标题、标签及翻译内容。
3.  通过短延迟模拟 LLM 的处理时间，确保用户体验真实。

### 3.3 新手引导 (User Onboarding)

使用 **driver.js** 库实现引导：

-   **触发时机**: 检测到 `demoMode` 且用户首次进入后台时自动开启，或通过 Banner 上的“开始演示”手动重新开启。
-   **引导路径**:
    1.  **登录**: 自动填充演示账号密码。
    2.  **仪表盘**: 概览各项统计数据。
    3.  **新建文章**: 引导进入编辑器。
    4.  **AI 辅助**: 暗示点击“星星”图标，生成标题、摘要或标签。
    5.  **发布流程**: 演示设置 Slug 并点击发布（在内存中生效）。
-   **视觉强调**: 使用高亮遮罩聚焦关键 UI 元素（如右侧边栏的 AI 按钮组）。

### 3.4 数据库策略

在 `server/database/index.ts` 中根据 `DEMO_MODE` 自动调整：

```typescript
// 当启用 Demo 模式时，强制使用内存 SQLite
if (process.env.NUXT_PUBLIC_DEMO_MODE === "true") {
    options = {
        type: "better-sqlite3",
        database: ":memory:",
        synchronize: true, // 必须同步以创建表结构
    };
    // TODO: 触发预填充 (Seed) 脚本
}
```

### 3.5 前端实现

-   **引导 Banner**: 在页面显著位置显示演示状态，提供“新手引导”入口。
-   **禁止持久化提醒**: 在修改成功后的 Toast 中增加“修改仅在演示期间生效”的提示。

## 4. 安全与维护 (Security & Maintenance)

-   **状态隔离**: 演示账号不具备修改系统级敏感配置（如环境变量、密钥）的权限。
-   **会话控制**: 演示模式的 Session 过期时间较短（如 1 小时）。
-   **性能**: 内存数据库可极大提升 Demo 环境响应速度。

## 5. 待办事项 (Next Steps)

-   [ ] 安装并配置 `driver.js`。
-   [ ] 实现 `MockAIProvider` 返回预设内容。
-   [ ] 编写 `seed-demo.ts` 预填充高质量的演示文章和分类。
-   [ ] 编写 `onboarding.ts` 引导逻辑并适配编辑器 UI。
-   [ ] 编写核心拦截器 `demo-guard.ts` (用于二次确认拦截极少数敏感操作)。
