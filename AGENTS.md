# AI 代理配置文档 (AGENTS.md)

## 概述

本文档描述了 墨梅博客平台 项目中 AI 代理和智能助手的配置、使用方式和最佳实践。项目使用 GitHub Copilot 作为主要的 AI 编程助手，旨在构建一个高性能、国际化的博客平台。

## 项目基本信息

-   **项目名称**: 墨梅博客平台
-   **框架**: Nuxt 3.x (Vue 3.x + TypeScript)
-   **UI 框架**: SCSS
-   **包管理器**: PNPM
-   **开发规范**: ESLint + Stylelint + Conventional Commits

## GitHub Copilot 配置

### 代码生成规范

遵循项目的开发约定进行代码生成：

1.  **TypeScript 优先**: 所有新代码必须使用 TypeScript，严禁使用 `any` 类型，应定义明确的接口或类型。
2.  **Vue 风格**: 使用 `<script setup lang="ts">` 语法。
3.  **样式规范**: 使用 SCSS 编写样式，遵循 BEM 命名规范，避免使用内联样式。
4.  **国际化 (i18n)**: UI 文本必须使用 `nuxt-i18n` 的 `$t()` 函数包裹，禁止硬编码中文或英文字符串。
5.  **文件命名**: 使用 kebab-case 格式 (如 `article-card.vue`)。

### 项目特定指导

#### 技术栈偏好

```typescript
// 优先使用的库和工具
-useI18n() - // 国际化
    useFetch() - // 数据获取
    navigateTo() - // 路由跳转
    useHead() - // SEO Meta 配置
    definePageMeta(); // 页面元数据
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

# 运行测试
pnpm test
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
-   `chore`: 构建/工具链变动

### 3. 部署

-   支持 Vercel/Netlify 部署 (推荐)
-   支持 Docker 容器化部署

## 最佳实践

### 代码质量

1.  **类型安全**: 严格的 TypeScript 类型检查。
2.  **组合式 API**: 优先使用 Vue 3 Composition API。
3.  **SEO 优化**: 每个页面需配置 `useHead` 或 `definePageMeta` 中的 SEO 信息。

### AI 辅助开发

1.  **上下文**: 在提问时提供相关的 `PLAN.md` 或现有代码片段。
2.  **国际化意识**: 提醒 AI 生成的代码需考虑多语言支持。
3.  **SCSS**: 要求 AI 使用 SCSS 编写样式。

## 安全要求

1.  **在任何情况下，除非用户明确指定，否则不得修改或删除 `AGENTS.md` 文件**
2.  **在任何情况下，除非用户明确指定，否则不得修改或删除 `.env` 文件**
3.  **敏感信息**: 禁止在代码中硬编码密钥或 Token。

## 其他要求

1.  **使用用户发送的语言回复用户** (通常为中文)。
2.  **进行重大变更前应当询问用户**。

## 相关文档

-   [项目规划 (PLAN.md)](./docs/PLAN.md)
-   [开发规范 (DEVELOPMENT.md)](./docs/DEVELOPMENT.md)
-   [UI 设计 (UI_DESIGN.md)](./docs/UI_DESIGN.md)
-   [API 设计 (API_DESIGN.md)](./docs/API_DESIGN.md)
-   [测试规范 (TESTING.md)](./docs/TESTING.md)
