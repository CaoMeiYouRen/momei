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
-   **规划与评估规范**: 涉及项目路线图、阶段性任务规划及评估，请严格遵循 [项目规划与评估规范](./planning.md)。

### 2.3 样式规范 (CSS/SCSS)

-   **复用优先**: 优先使用 `assets/styles` 下定义的全局变量 (Variables) 和混合宏 (Mixins)。
-   **一致性**: 确保新样式符合 UI 设计文档 (`../design/ui.md`) 的整体风格。

### 2.4 目录规划与依赖约束 (Directory Structure & Dependencies)

-   **项目目录结构**:

    -   `components/`: Vue 组件目录。
    -   `pages/`: Nuxt 页面路由目录。
    -   `styles/`: 样式文件目录 (SCSS)。
    -   `public/`: 公共静态资源目录（如图片、字体等）。
    -   `plugins/`: Nuxt 插件目录。
    -   `middleware/`: 路由中间件目录。
    -   `composables/`：Vue 组合式 API 目录。
    -   `layouts/`： 布局目录。
    -   `libs/`: 第三方库封装目录。
    -   `types`/: TypeScript 类型定义目录。
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
    -   `web` 可以引用 `shared`，但 **禁止反向依赖**。
    -   `server` 可以引用 `shared`，但 **禁止反向依赖**。
    -   **入口管理**: 通过 `barrel` 文件（index.ts）暴露统一入口，避免跨层误引用。

## 3. 技术栈与库使用指南 (Tech Stack & Libraries)

为保持项目一致性，请严格遵循以下库的使用规范，避免引入重复功能的第三方库。

| 功能领域       | 推荐库/方法             | 说明                                                                |
| :------------- | :---------------------- | :------------------------------------------------------------------ |
| **页面导航**   | `navigateTo`            | 符合 Nuxt 规范，禁止直接使用 `router.push`。                      |
| **API 请求**   | `useFetch` / `$fetch`   | SSR 场景必用 `useFetch` 以利用缓存与预取；客户端逻辑可用 `$fetch`。 |
| **日期时间**   | `useI18nDate` / `dayjs` | 模板中优先使用 `useI18nDate` 的 `d` 函数；逻辑中使用 `dayjs`。      |
| **工具函数**   | `lodash-es`             | 处理数组、对象深拷贝、防抖节流等。                                  |
| **Admin 列表** | `useAdminList`          | 所有的后台管理表格必须使用此 Composable 管理状态。                  |
| **文件操作**   | `fs-extra`              | 替代原生 `fs`，提供更友好的 Promise 支持和错误处理。                |
| **日志记录**   | `server/utils/logger`   | 统一日志格式，服务端必须使用此模块记录敏感操作。                    |

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

## 6. 提交前检查 (Pre-commit Checks)

在提交代码 (Git Commit) 之前，开发者**必须**确保本地环境通过以下所有检查。建议配置 `husky` 的 `pre-commit` 钩子自动执行。

1.  **代码风格检查**:

    ```bash
    pnpm run lint
    ```

    -   确保无 ESLint/Stylelint 报错。

2.  **类型检查**:

    ```bash
    pnpm run typecheck
    ```

    -   确保无 TypeScript 类型错误。

3.  **单元测试**:
    ```bash
    pnpm run test
    ```
    -   确保所有现有测试用例通过。

**注意**: 任何未通过上述检查的提交将被视为不合规，CI 流水线将会拦截此类合并请求。

## 7. 文档规范 (Documentation Standards)

为了保证文档的可维护性和清晰度，所有功能模块的设计文档应遵循以下规范：

-   **模块化文档**:

    -   功能设计文档应存放在 `docs/design/modules/` 目录下。
    -   每个模块文档应包含该模块的 **UI 设计** 和 **API 设计**。
    -   避免在 `api.md` 或 `ui.md` 中堆砌所有细节，这两份文档应仅保留全局性的设计原则和架构说明。

-   **结构要求**:
    -   **概述**: 简述模块功能。
    -   **页面设计**: 描述页面布局、交互逻辑、组件使用。
    -   **接口设计**: 列出相关 API 的路由、方法、参数、权限要求。

## 8. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](../plan/roadmap.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](./testing.md)
