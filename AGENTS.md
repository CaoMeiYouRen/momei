# AI 代理配置文档 (AGENTS.md)

## 概述

本文档描述了 墨梅博客 项目中 AI 代理和智能助手的配置、使用方式和最佳实践。项目使用 GitHub Copilot 作为主要的 AI 编程助手，旨在构建一个高性能、国际化的博客平台。

## 项目基本信息

-   **项目名称**: 墨梅博客
-   **框架**: Nuxt 4.x (Vue 3.x + TypeScript)
-   **UI 框架**: SCSS + PrimeVue
-   **包管理器**: PNPM
-   **开发规范**: ESLint + Stylelint + Conventional Commits

## GitHub Copilot 配置

### 代码生成规范

遵循项目的开发约定进行代码生成：

1.  **TypeScript 优先**: 所有新代码必须使用 TypeScript，严禁使用 `any` 类型，应定义明确的接口或类型。
2.  **Vue 风格**: 使用 `<script setup lang="ts">` 语法。
3.  **样式规范**: 使用 SCSS 编写样式，遵循 BEM 命名规范，避免使用内联样式。优先复用全局变量和 Mixins。
4.  **国际化 (i18n)**: UI 文本必须使用 `nuxt-i18n` 的 `$t()` 函数包裹，禁止硬编码中文或英文字符串。
5.  **文件命名**: 使用 kebab-case 格式 (如 `article-card.vue`)。

### 项目特定指导

#### 技术栈偏好

```typescript
// 优先使用的库和工具
useI18n() - // 国际化
    useFetch() - // 数据获取
    navigateTo() - // 路由跳转
    useHead() - // SEO Meta 配置
    definePageMeta() - // 页面元数据
    useAdminList() - // 后台列表管理
    authClient - // Better-Auth 客户端 (lib/auth-client.ts)
```

#### 项目目录结构理解

-   `components/`: Vue 组件目录。
-   `pages/`: 页面路由目录。
-   `layouts/`: 布局文件。
-   `public/`: 静态资源。
-   `server/`: 服务端代码。
    -   `server/api/`: API 接口。
-   `utils/`: 通用工具函数。
-   `types/`: TypeScript 类型定义。
-   `locales/`: 国际化语言包。

### 代码生成示例

#### Vue 组件模板 (结合 SCSS 和 i18n)

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

#### API 路由模板

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

## 开发工作流程

### 1. 代码开发

```bash
# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint

# CSS 检查
pnpm lint:css

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

### 2. 提交规范

遵循 Conventional Commits 规范：

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

commit message 使用中文描述变更内容。

### 3. 部署

-   支持 Vercel/Netlify 部署 (推荐)
-   支持 Cloudflare Workers 部署 (正在开发中)
-   支持 Docker 容器化部署

## 最佳实践

### 代码质量

1.  **类型安全**: 严格的 TypeScript 类型检查。
2.  **组合式 API**: 优先使用 Vue 3 Composition API。
3.  **SEO 优化**: 每个页面需配置 `useHead` 或 `definePageMeta` 中的 SEO 信息。

### AI 辅助开发

1.  **上下文理解**: 在使用 Copilot 时，确保提供足够的上下文信息。
2.  **需求抽离 (核心)**：在开始任务前，如遇模糊意图，智能体**必须通过采访追问**的方式问清楚核心需求。遵循“先结构后细节、一次一问、逐步深入”的方法论，从模糊意图抽离真实需求。
3.  **强制性文档阅读 (Mandatory Reading)**：在执行任务的特定阶段，智能体**必须**主动读取以下文档以确保符合项目标准：
    -   **任务开始前**：必须读取[项目规划](./docs/plan/roadmap.md)和[待办事项](./docs/plan/todo.md)，明确当前任务、目标及已归档的历史。
    -   **进入开发 (Do) 阶段前**：必须读取[开发规范](./docs/standards/development.md)和[API 规范](./docs/standards/api.md)。
    -   **涉及安全性或权限时**：必须读取[安全规范](./docs/standards/security.md)。
    -   **执行测试 (Test) 或补齐测试 (Enhance) 前**：必须读取[测试规范](./docs/standards/testing.md)。
    -   **涉及 UI 变动时**：必须读取[UI 设计](./docs/design/ui.md)。
    -   **进行任务规划或变更路线图前**：必须读取[项目规划规范](./docs/standards/planning.md)。
4.  **遵守规范**: 在分析任务属于哪个模块后，严格遵守上述所有相关规范。

### 4. 遵循 PDTFC+ 完整循环 (功能开发与测试补充)

任何代码生成或修改任务必须遵循迭代循环，**严禁**只开发功能而不写测试，或将一堆功能的测试积压到最后才写。

1.  **Plan (计划)**: 包含设计更新和测试方案规划。
2.  **Do (执行)**: 编写业务代码。
3.  **UI Validate (UI 验证)**: 若涉及 UI 改动，必须通过浏览器验证实际渲染效果。先检查 3000 端口，未启动则手动启动。
4.  **Test (测试)**: 运行现有测试。**着重审查**新功能对旧测试的破坏性影响，判断是需要修复代码还是更新陈旧测试。
5.  **Fix (修复)**: 确保所有现有指标达标。
6.  **Commit (提交)**: 先行提交已验证的功能代码。
7.  **Enhance (补充测试)**: 为新功能补充测试。
8.  **Commit (提交测试)**: 提交新补充的测试用例。

### 5. AI 智能体体系 (AI Agents System)

项目定义了以下智能体，协同完成 PDTFC+ 完整开发任务。

#### 核心编排
-   **`@full-stack-master` (全栈大师)**: 首席指挥官。负责全局任务分配、多角色协同及 PDTFC+ 工作流的总体控制。

#### 规划与设计 (Plan)
-   **`@product-manager` (产品经理)**: 负责接收用户意图，通过“采访模式”进行需求对齐，维护 `roadmap.md` 和 `todo.md`。
-   **`@system-architect` (系统架构师)**: 负责技术方案拆解，确定受影响文件、API 设计及数据库架构。

#### 业务执行 (Do)
-   **`@frontend-developer` (前端开发者)**: 专注于 Vue 3 (Nuxt 4), SCSS (BEM), I18n 文本提取及 UI 自动化验证 (V)。
-   **`@backend-developer` (后端开发者)**: 专注于 Nitro API, Drizzle ORM 以及权限/安全逻辑。

#### 质量与保障 (Validate/Test/Review)
-   **`@quality-guardian` (质量守卫)**: 负责代码 Lint、类型检查与全量测试。
-   **`@ui-validator` (UI 验证专家)**: 负责浏览器侧的视觉与交互验证。
-   **`@test-engineer` (测试工程师)**: 负责编写与补充 Vitest 高质量测试用例。
-   **`@code-reviewer` (代码审查者)**: 负责安全审计与规范契合度审查。

#### 交付与维护 (Commit/Deploy)
-   **`@release-manager` (发布管理员)**: 负责 Git 暂存、生成 Conventional Commits、更新日志及部署确认。
-   **`@documentation-specialist` (文档专家)**: 维护 `docs/` 下的设计与规划文档。
-   **`@qa-assistant` (问答助手)**: 提供只读的项目咨询与逻辑检索。

## 安全要求

1.  **在任何情况下，除非用户明确指定，否则不得修改或删除 `AGENTS.md` 文件**
2.  **在任何情况下，除非用户明确指定，否则不得修改或删除 `.env` 文件**
3.  **敏感信息**: 禁止在代码中硬编码密钥或 Token。
4.  **终端命令安全规范**:
    -   **环境检查**: 在执行任何 shell 命令之前，必须先检查当前的操作系统 (Windows, Linux, macOS) 和运行环境 (CMD, PowerShell, Bash 等)，确保命令的可执行性。
    -   **路径校验**: 在执行涉及文件或文件夹删除的命令 (如 `rm`, `dir /s`, `rd` 等) 前，必须验证路径的有效性。
    -   **空路径规避**: 严禁将空字符串或未定义的变量作为路径参数传递给删除命令，以防止意外删除根目录或当前工作目录。极力避免执行类似于 `rm -rf /` 或 `rm -rf $EMPTY_VAR/*` 的危险操作。

## 其他要求

1.  **使用用户发送的语言回复用户** (通常为中文)。
2.  **进行重大变更前应当询问用户**。

## 相关文档

-   [项目规划](./docs/plan/roadmap.md)
-   [待办事项](./docs/plan/todo.md)
-   [开发规范](./docs/standards/development.md)
-   [安全规范](./docs/standards/security.md)
-   [测试规范](./docs/standards/testing.md)
-   [API 规范](./docs/standards/api.md)
-   [UI 设计](./docs/design/ui.md)
-   [API 设计](./docs/design/api.md)
