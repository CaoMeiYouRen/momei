# 墨梅 (Momei) 开发规范文档

## 1. 核心原则 (Core Principles)

-   **模块化与组件化**: 遵循高内聚低耦合原则，提升代码的可维护性与复用性。
-   **降低耦合度**: 纯函数（纯逻辑）与副作用代码分层，公共逻辑迁移到 `utils/**` 或可复用 hooks；核心模块依赖方向单向、可注入。
-   **提升复用率**: 重复逻辑抽象为 composable、指令或 util，删减样板代码（表单、API 包装、校验等）。
-   **类型安全**: 全面使用 TypeScript。严禁使用 `any`，在不确定类型时优先使用 `unknown` 配合类型守卫 (Type Guards)。
-   **最小变更原则**: 修改代码时应聚焦于目标本身，尽量减少对无关代码的触动，避免引入不必要的副作用。
-   **实用性优先**: 避免过度设计。在引入新功能或重构前，需评估其在生产环境的真实价值与成本（ROI 分析）。

## 2. 代码风格与规范 (Code Style & Standards)

### 2.1 命名规范

-   **文件命名**: 统一使用 **kebab-case** (小写字母 + 连字符)，例如 `article-card.vue`, `date-utils.ts`。
-   **工具函数**: 命名应清晰且具有描述性，动词开头，如 `formatDate`, `getUserById`。

### 2.2 逻辑控制

-   **Early Return**: 优先使用 `return` 提前结束函数执行，减少 `if/else` 嵌套层级，保持代码扁平化。
-   **复杂度控制**: 定期审查代码复杂度 (Cyclomatic Complexity)，避免过长的函数和深层嵌套。

### 2.3 样式规范 (CSS/SCSS)

-   **复用优先**: 优先使用 `assets/styles` 下定义的全局变量 (Variables) 和混合宏 (Mixins)。
-   **一致性**: 确保新样式符合 UI 设计文档 (`docs/UI_DESIGN.md`) 的整体风格。

### 2.4 目录规划与依赖约束 (Directory Structure & Dependencies)

-   **项目目录结构**:

    -   `components/`: Vue 组件目录。
    -   `pages/`: Nuxt 页面路由目录。
    -   `assets/styles/`: 样式文件目录 (SCSS)。
    -   `public/`: 公共静态资源目录（如图片、字体等）。
    -   `plugins/`: Nuxt 插件目录。
    -   `middleware/`: 路由中间件目录。
    -   `tests/`: 测试代码目录。
    -   `utils/`: 工具函数目录。
        -   `utils/shared/`: 不依赖 Nuxt/Node 的纯函数与常量，可直接被前后端复用。
        -   `utils/web/`: 只在客户端使用的逻辑（浏览器 API、窗口状态、组件 helper）。
    -   `server/`: 服务器端代码目录。
        -   `server/api/`: API 路由目录。
        -   `server/middleware/`: 服务器中间件目录。
        -   `server/utils/`: 仅服务端可用的工具函数（数据库、文件系统）。
        -   `server/database/`: 数据库相关代码目录。
    -   `docs`：文档目录

-   **依赖约束**:
    -   `shared` **不得引用** `web` 或 `server`。
    -   `web` 可以引用 `shared`。
    -   `server` 可以引用 `shared`，但 **禁止反向依赖**。
    -   **入口管理**: 通过 `barrel` 文件（index.ts）暴露统一入口，避免跨层误引用。

## 3. 技术栈与库使用指南 (Tech Stack & Libraries)

为保持项目一致性，请严格遵循以下库的使用规范，避免引入重复功能的第三方库。

| 功能领域     | 推荐库/方法             | 说明                                                                |
| :----------- | :---------------------- | :------------------------------------------------------------------ |
| **页面导航** | `navigateTo`            | 符合 Nuxt 3 规范，禁止直接使用 `router.push`。                      |
| **API 请求** | `useFetch` / `$fetch`   | SSR 场景必用 `useFetch` 以利用缓存与预取；客户端逻辑可用 `$fetch`。 |
| **日期时间** | `dayjs`                 | 处理格式化、计算等复杂逻辑。仅极简单场景可用原生 `Date`。           |
| **工具函数** | `lodash-es`             | 处理数组、对象深拷贝、防抖节流等。                                  |
| **文件操作** | `fs-extra`              | 替代原生 `fs`，提供更友好的 Promise 支持和错误处理。                |
| **电话号码** | `google-libphonenumber` | 处理国际化电话号码的验证与格式化。                                  |
| **日志记录** | `logger` 模块           | 统一日志格式，必须包含上下文信息 (Context)。                        |

## 4. 开发流程与最佳实践 (Workflow & Best Practices)

### 4.1 新增功能

1.  **查重**: 编写新代码前，必须检查 `utils/` 或现有组件中是否已有类似实现。
2.  **复用**: 优先复用或扩展现有逻辑，避免重复造轮子。
3.  **依赖**: 仅使用 `package.json` 中已声明的依赖。如需引入新库，需经过团队讨论。

### 4.2 代码变更 (Refactoring & Changes)

1.  **影响评估**: 修改核心组件或公共方法前，必须评估对现有功能的影响。如果改动可能破坏现有逻辑，应重新设计方案。
2.  **复杂度审查**: 提交前自查代码复杂度，利用 ESLint 等工具辅助检查。

## 5. 安全规范 (Security)

-   **XSS 防护**:
    -   严格检查所有涉及用户输入并渲染到页面的环节。
    -   使用适当的清理库 (Sanitizer) 处理 HTML 内容。
    -   Vue 模板中默认自动转义，但在使用 `v-html` 时必须格外小心。

## 6. 相关文档

-   [AI 代理配置 (AGENTS.md)](../AGENTS.md)- [项目计划 (PLAN.md)](./PLAN.md)
-   [UI 设计 (UI_DESIGN.md)](./UI_DESIGN.md)
-   [API 设计 (API_DESIGN.md)](./API_DESIGN.md)
-   [测试规范 (TESTING.md)](./TESTING.md)
