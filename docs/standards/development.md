# 墨梅 (Momei) 开发规范文档

## 1. 核心原则 (Core Principles)

- **模块化与组件化**: 遵循高内聚低耦合原则，提升代码的可维护性与复用性。
- **降低耦合度**: 纯函数（纯逻辑）与副作用代码分层，公共逻辑迁移到 `utils/**` 或可复用 hooks；核心模块依赖方向单向、可注入。
- **提升复用率**: 重复逻辑抽象为 composable、指令或 util，删减样板代码（表单、API 包装、校验等）。
- **类型安全**: 全面使用 TypeScript。严禁使用 `any`，在不确定类型时优先使用 `unknown` 配合类型守卫 (Type Guards)。
- **最小变更原则**: 修改代码时应聚焦于目标本身，尽量减少对无关代码的触动，避免引入不必要的副作用。
- **实用性优先**: 避免过度设计。在引入新功能或重构前，需评估其在生产环境的真实价值与成本（ROI 分析）。

## 2. 代码风格与规范 (Code Style & Standards)

### 2.1 命名规范

- **文件命名**: 统一使用 **kebab-case** (小写字母 + 连字符)，例如 `article-card.vue`, `date-utils.ts`。
- **工具函数**: 命名应清晰且具有描述性，动词开头，如 `formatDate`, `getUserById`。
- **Schema 与类型命名**: 使用 **PascalCase**，例如 `UserProfile`, `ArticleSchema`；Schema 的字段则应该使用 **camelCase** 风格。

### 2.2 逻辑控制

- **Early Return**: 优先使用 `return` 提前结束函数执行，减少 `if/else` 嵌套层级，保持代码扁平化。
- **复杂度控制**: 定期审查代码复杂度 (Cyclomatic Complexity)，避免过长的函数和深层嵌套。
- **规划与评估规范**: 涉及项目路线图、阶段性任务规划及评估，请严格遵循 [项目规划与评估规范](./planning.md)。

### 2.3 样式规范 (CSS/SCSS)

- **复用优先**: 优先使用 `assets/styles` 下定义的全局变量 (Variables) 和混合宏 (Mixins)。
- **一致性**: 确保新样式符合 UI 设计文档 (`../design/ui.md`) 的整体风格。
- **禁止使用 `!important`**: 严禁在普通组件和全局样式中使用 `!important` 关键字。
    - 理由：它会破坏 CSS 的层级结构和权重系统，导致维护困难。
    -  Ausnahme (例外)：在某些无法控制的第三方样式覆盖或**邮件模板** (MJML/Email HTML) 等特殊兼容性场景下可以酌情使用。
    - **强制要求**：如果开发者认为在常规开发中**必须**使用该关键字，则必须在代码注释中说明原因，并**事先获得用户或架构师的专门批准**。
    - **已知冲突 (Known Conflict)**：目前全站禁用 `!important` 与“用户自定义主题 CSS”存在潜在权重冲突（用户自定义样式可能无法覆盖默认样式）。该问题将通过增强 CSS 变量系统或引入 CSS `@layer` 的技术手段解决，不应作为恢复滥用 `!important` 的理由。
- **纯 SCSS**: 禁止在样式文件中使用任何 CSS-in-JS 语法或工具（如 `styled-components`、`emotion`、`tailwindcss` 等）。所有样式必须以纯 SCSS 形式编写，确保样式的可维护性和一致性。

### 2.4 目录规划与依赖约束 (Directory Structure & Dependencies)

- **项目目录结构**:
    - `components/`: Vue 组件目录。
    - `pages/`: Nuxt 页面路由目录。
    - `styles/`: 样式文件目录 (SCSS)。
    - `public/`: 公共静态资源目录（如图片、字体等）。
    - `plugins/`: Nuxt 插件目录。
    - `middleware/`: 路由中间件目录。
    - `composables/`：Vue 组合式 API 目录。
    - `layouts/`： 布局目录。
    - `libs/`: 第三方库封装目录。
    - `types`/: TypeScript 类型定义目录。
    - `tests/`: 测试代码目录。
    - `utils/`: 工具函数目录。
        - `utils/shared/`: 不依赖 Nuxt/Node 的纯函数与常量，可直接被前后端复用。
        - `utils/web/`: 只在客户端使用的逻辑（浏览器 API、窗口状态、组件 helper）。
    - `server/`: 服务器端代码目录。
        - `server/api/`: API 路由目录。
        - `server/middleware/`: 服务器中间件目录。
        - `server/utils/`: 仅服务端可用的工具函数（数据库、文件系统）。
        - `server/database/`: 数据库相关代码目录。
    - `docs`：文档目录

- **依赖约束**:
    - `shared` **不得引用** `web` 或 `server`。
    - `web` 可以引用 `shared`，但 **禁止反向依赖**。
    - `server` 可以引用 `shared`，但 **禁止反向依赖**。
    - **入口管理**: 通过 `barrel` 文件（index.ts）暴露统一入口，避免跨层误引用。

### 2.5 代码生成准则 (Code Generation Guidelines)

AI 在生成代码时应严格遵守以下约定：

1.  **TypeScript 优先**: 所有新代码必须使用 TypeScript，严禁使用 `any` 类型，必须定义明确的接口或类型。
2.  **Vue 风格**: 统一使用 `<script setup lang="ts">` 语法及组合式 API。
3.  **样式规范**: 使用 SCSS 编写样式，遵循 BEM 命名规范，禁止使用内联样式。优先复用全局变量和 Mixins。
4.  **国际化 (i18n)**: UI 文本必须使用 `nuxt-i18n` 的 `$t()` 函数包裹，禁止硬编码中英文字符串。国际化的字段名称（Key）应该是**小写+下划线 (snake_case)**，但项目中已经使用小写+连字符 (kebab-case) 的现有字段除外。
5.  **文件命名**: 统一使用 kebab-case 格式 (如 `article-card.vue`)。
6.  **SEO 优化**: 每个页面及文章详情页必须配置 `useHead` 或 `definePageMeta` 中的 SEO 信息。

### 2.6 Git 工作流与 Worktree 规范 (Git Workflow & Worktree)

项目采用 Git Worktree 进行多分支并行管理，详情请参阅 [Git 工作流规范](./git.md)。

- **分支职责**: `master` (主分支/Hotfix), `dev` (开发), `test` (测试), `fix` (修复), `docs` (文档)。
- **工作树路径**: 统一采用 `../momei-[branch]` 格式，与主目录同级。
- **环境隔离**: 各工作树应保持环境独立，避免跨目录误操作。

### 2.7 提交规范 (Commit Standards)

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，commit message 使用中文描述变更内容：

-   `feat`: 新功能
-   `fix`: 修复 Bug
-   `docs`: 文档变更
-   `style`: 代码格式调整
-   `refactor`: 代码重构
-   `perf`: 性能优化
-   `test`: 测试相关
-   `ci`: CI 配置变更
-   `build`: 构建相关
-   `chore`: 构建/工具链变动

### 2.8 提交规模与原子化改动 (Commit Scale & Atomic Changes)

为了确保代码的可追溯性与审核效率，必须严格控制每次代码改动的规模：

1.  **原子化逻辑**: 确保每一次改动都是一个**小规模**的改动。具体而言，一次提交应对应 [待办事项 (Todo)](../plan/todo.md) 中的**一个**原子条目。
2.  **规模控制**: 每一次的代码改动应该控制文件数量和**改动的行数**。建议一次提交一个 commit。单次 commit 涉及的改动文件数量**原则上不要超过 10 个**。
3.  **单一功能点**: 每一次提交的代码都应该是与**一个特定功能点**相关的内容。如果同时修改了多个功能点，必须拆分为多次提交。
4.  **大任务拆分**: 在执行大规模改动（重构或复杂功能实现）时，应当将其拆分为多个步骤的小规模改动，并分别进行提交。
5.  **质量关卡**: 在执行 git commit 之前，必须确保代码通过了本地的质量校验（Lint + Typecheck + Test）。

### 2.9 文档编写规范 (Documentation Standards)

所有项目文档的编写必须遵循 [文档规范文档](./documentation.md)。

- 每个文件必须且只能有一个 H1 标题。
- 复杂流程优先使用 Mermaid 流程图或时序图。
- 修改代码逻辑后，必须同步更新对应的设计文档 (`../design/`)。

## 3. 技术栈与库使用指南 (Tech Stack & Libraries)

为保持项目一致性，请严格遵循以下库的使用规范，避免引入重复功能的第三方库。

| 功能领域       | 推荐库/方法             | 说明                                                                |
| :------------- | :---------------------- | :------------------------------------------------------------------ |
| **页面导航**   | `navigateTo`            | 符合 Nuxt 规范，禁止直接使用 `router.push`。                        |
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

### 4.3 常用开发命令 (Common Development Commands)

```bash
# 启动开发服务器
pnpm dev

# 代码风格检查
pnpm lint

# 样式检查
pnpm lint:css

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 运行测试覆盖率
pnpm test:coverage

# 运行端到端测试 (E2E)
pnpm test:e2e

# 全面质量验证 (Lint + Typecheck + Unit Test + E2E)
pnpm verify

# 构建生产版本
pnpm build
```

## 5. 安全规范 (Security)

- **XSS 防护**:
    - 严格检查所有涉及用户输入并渲染到页面的环节。
    - 使用适当的清理库 (Sanitizer) 处理 HTML 内容。
    - Vue 模板中默认自动转义，但在使用 `v-html` 时必须格外小心。

## 6. 提交前检查 (Pre-commit Checks)

在提交代码 (Git Commit) 之前，开发者**必须**确保本地环境通过以下所有检查。建议配置 `husky` 的 `pre-commit` 钩子自动执行。

1.  **代码风格检查**:

    ```bash
    pnpm run lint
    ```

    - 确保无 ESLint/Stylelint 报错。

2.  **类型检查**:

    ```bash
    pnpm run typecheck
    ```

    - 确保无 TypeScript 类型错误。

3.  **单元测试**:

    ```bash
    pnpm run test
    ```

    - 确保所有现有测试用例通过。

**注意**: 任何未通过上述检查的提交将被视为不合规，CI 流水线将会拦截此类合并请求。

## 7. 配置读取规范 (Configuration Access Standards)

为了实现“零配置”和“热生效”，项目中严禁直接在业务逻辑中使用 `process.env`（基础设施配置除外，如 `DATABASE_URL`）。

- **后端 (Server)**: 
    - 统一使用 `server/services/setting.ts` 中的 `getSetting(key)` 或 `getSettings([keys])` 方法。
    - 优先考虑从 `event.context.settings` (待实现) 中读取已注入的配置以提升性能。
- **前端 (Frontend)**:
    - 统一使用 `useMomeiConfig()` Composable。
    - 避免强依赖 `useRuntimeConfig()`，除非是真正的构建时静态变量。

## 8. 文档规范 (Documentation Standards)

为了保证文档的可维护性和清晰度，所有文档编写应遵循本项目的 [文档规范](./documentation.md)。

-   **核心原则**: 结构化、模块化、国际化同步。
-   **存储要求**: 按照功能分类存放于 `docs/` 各子目录（如 `design/modules/`）。
-   **门户同步**: 核心变更需同步更新根目录 `README.md`。

## 9. 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](../plan/roadmap.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](./testing.md)

## 10. 代码示例 (Code Examples)

### 10.1 Vue 组件模板 (结合 SCSS 和 i18n)

```vue
<template>
    <div class="article-card">
        <h2 class="article-card__title">
            {{ $t("components.title") }}
        </h2>
        <slot />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

defineProps<{
    title?: string;
}>();
</script>

<style lang="scss" scoped>
.article-card {
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    background-color: #fff;

    &__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
    }
}

// Dark mode example
:global(.dark) .article-card {
    background-color: #1f2937;

    &__title {
        color: #fff;
    }
}
</style>
```

### 10.2 API 路由模板

```typescript
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
    try {
        // 示例：获取查询参数
        const query = getQuery(event);

        // 业务逻辑...

        return {
            code: 200,
            data: [],
        };
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }
});
```
