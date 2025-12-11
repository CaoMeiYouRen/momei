# 墨梅 (Momei) 测试规范文档

## 1. 概述 (Overview)

本文档旨在规范墨梅博客平台的测试流程，确保代码质量和系统的稳定性。本项目采用 **Vitest** 作为主要的测试框架，结合严格的 CI/CD 流程，保证每次提交的代码都经过充分验证。

## 2. 测试工具 (Test Tools)

-   **单元测试 & 集成测试**: [Vitest](https://vitest.dev/)
    -   选择理由: 速度快，与 Vite/Nuxt 生态完美集成，API 兼容 Jest。
-   **端对端测试 (E2E)**: Playwright (推荐) 或 Cypress (视具体配置而定)。
-   **测试运行器**: `pnpm test`

## 3. 目录结构与命名规范 (Directory Structure & Naming)

### 3.1 单元测试 (Unit Tests)

所有单元测试文件必须**与源代码文件同级存放** (Co-location)，以便于维护和查找。

-   **命名规则**: `[filename].test.ts`
-   **适用范围**:
    -   工具函数 (`utils/`)
    -   API 处理逻辑 (`server/api/`)
    -   Vue 组件逻辑 (`components/`, `pages/`)
    -   Store 状态管理 (`stores/`)

**示例结构**:

```
utils/
  ├── date-formatter.ts
  └── date-formatter.test.ts  <-- 单元测试
components/
  ├── ArticleCard.vue
  └── ArticleCard.test.ts     <-- 组件测试
```

### 3.2 端对端测试 (E2E Tests)

所有 E2E 测试文件统一存放在项目根目录下的 `tests/` 目录中。

-   **目录位置**: `/tests/e2e/`
-   **命名规则**: `[feature].e2e.test.ts`
-   **适用范围**:
    -   关键业务流程 (如：登录 -> 发布文章 -> 查看文章)
    -   跨页面交互
    -   真实浏览器环境验证

## 4. 测试内容要求 (Testing Requirements)

### 4.1 前端组件与页面

-   **组件测试**:
    -   验证 Props 传递是否正确。
    -   验证 Events 是否正确触发。
    -   验证关键的 UI 状态变化 (如 Loading, Error)。
    -   使用 `@vue/test-utils` 进行挂载和交互模拟。
-   **页面测试**:
    -   验证页面能否正常渲染。
    -   验证路由参数 (`route.params`, `route.query`) 的处理。
    -   验证 SEO Meta 信息 (`useHead`) 是否正确设置。

### 4.2 后端接口

-   验证 API 的输入参数校验 (Zod Schema)。
-   验证正常情况下的响应格式 (`code: 200`)。
-   验证异常情况下的错误处理 (如 401, 403, 404)。
-   Mock 数据库调用和外部服务 (如邮件发送)，避免测试污染真实环境。

## 5. 覆盖率要求 (Coverage)

-   **全项目目标覆盖率**: **≥ 60%**
-   **核心模块 (Utils, Server API)**: 建议 ≥ 80%
-   **UI 组件**: 建议 ≥ 50% (重点测试逻辑，而非样式)

运行覆盖率检查:

```bash
pnpm run test:coverage
```

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
