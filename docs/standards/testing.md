# 墨梅 (Momei) 测试规范文档

## 1. 概述 (Overview)

本文档旨在规范墨梅博客的测试流程，确保代码质量和系统的稳定性。本项目采用 **Vitest** 作为主要的测试框架，结合严格的 CI/CD 流程，保证每次提交的代码都经过充分验证。

## 2. 测试工具 (Test Tools)

-   **单元测试 & 集成测试**: [Vitest](https://vitest.dev/)
    -   选择理由: 速度快，与 Vite/Nuxt 生态完美集成，API 兼容 Jest。
-   **端对端测试 (E2E)**: Playwright (推荐) 或 Cypress (视具体配置而定)。
-   **测试运行器**: `pnpm test`

## 3. 目录结构与命名规范 (Directory Structure & Naming)

### 3.1 单元测试 (Unit Tests)

所有纯逻辑、工具函数、组件的单元测试文件必须**与源代码文件同级存放** (Co-location)。

**示例结构**:

```plain
utils/
  ├── date-formatter.ts
  └── date-formatter.test.ts  <-- 单元测试
components/
  ├── article-card.vue
  └── article-card.test.ts     <-- 组件测试
```

-   **命名规则**: `[filename].test.ts`
-   **适用范围**:
    -   工具函数 (`utils/`)
    -   Vue 组件 (`components/`, `pages/`) - 侧重组件逻辑与渲染
    -   TypeORM Entity 逻辑
    -   Store 状态管理 (`stores/`)

### 3.2 服务端集成/API 测试 (API & Integration Tests)

涉及数据库交互、API 接口调用、完整业务流程的测试，统一存放在 `tests/` 目录下。

-   **目录位置**: `tests/server/`
-   **命名规则**: `[feature].test.ts` 或 `[api-path].test.ts`
-   **适用范围**:
    -   API 接口测试 (`server/api/`)
    -   数据库连接与查询测试 (`server/database/`)
    -   复杂业务流程集成测试

### 3.3 端对端测试 (E2E Tests)

所有 E2E 测试文件统一存放在项目根目录下的 `tests/e2e/` 目录中。本项目使用 **Playwright** 作为 E2E 测试框架。

-   **目录位置**: `/tests/e2e/`
-   **命名规则**: `[feature].e2e.test.ts`
-   **配置文件**: `playwright.config.ts`
-   **适用范围**:
    -   关键业务流程 (如：登录 -> 发布文章 -> 查看文章)
    -   跨页面交互 (语言切换、主题切换)
    -   真实浏览器环境验证 (Chromium, Firefox, Webkit)
-   **运行命令**:
    -   `pnpm test:e2e`: 在命令行界面运行所有 E2E 测试。
    -   `pnpm test:e2e:ui`: 启动 Playwright UI 界面，方便调试。

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
-   **回归任务附加要求**: 回归型治理任务必须补充或修正测试用例，确保覆盖率不低于上述门槛；若当前基线已高于门槛，不得因回归任务继续下滑。

运行覆盖率检查:

```bash
pnpm run test:coverage
```

## 6. 高效测试策略 (Efficient Testing Strategy)

由于全量测试（尤其是涉及数据库的集成测试）耗时较长，为了在保证质量的同时提升开发效率，需遵循以下分级测试准则：

1.  **按需定向测试 (Targeted Testing)**: 
    -   在日常开发和修复 Bug 过程中，**应当优先**仅运行与本次改动直接相关的测试文件。
    -   **理由**: 全量测试极其缓慢，频繁运行会严重阻塞开发流程。
    -   **命令示例**: `pnpm test [filename_keyword]`。
    -   **命中不稳定时的回退**: 若关键字方式无法稳定命中同级 `*.test.ts`，优先使用 `pnpm exec vitest run path/to/file.test.ts`。

2.  **全量测试准入条件 (Full Test Triggers)**: 
    -   **除非涉及以下情况，否则严禁在普通任务中执行全量测试**:
        -   **大规模重构**: 涉及多个核心模块或基础工具函数变更。
        -   **关键逻辑变更**: 涉及认证、授权、核心数据库 Schema 调整。
        -   **安全敏感改动**: 涉及权限控制系统的修改。
        -   **专门的测试补强任务**: 即 [AI 协作规范](./ai-collaboration.md) 中 PDTFC+ 循环的 `T (Test)` 阶段或独立回归治理任务。
        -   **周期性回归任务**: 涉及代码优化、ESLint warning / 类型债治理、`database/*/init.sql` 同步、文档同步、测试同步或性能基线核对等易漂移治理事项。

3.  **全量测试超时预算**:
    -   在周期性回归任务中，允许执行全量 `pnpm test`、`pnpm test:coverage` 与 `pnpm verify`，但必须设置显式 timeout budget，严禁无限等待。
    -   建议预算：定向测试 10 分钟，全量 `pnpm test` 30 分钟，全量 `pnpm test:coverage` 30 分钟，全量 `pnpm verify` 60 分钟；若 CI 资源较低可上调，但必须在任务记录中说明。
    -   若执行超时，必须记录中止位置、已完成验证项与后续补跑计划，不得仅以“本地太慢”替代结果说明。

4.  **测试规模评估**:
    -   在执行测试前，必须评估本次改动的风险与规模。
    -   如果改动规模较小且逻辑独立，仅执行定向测试。
    -   如果改动规模较大、比较关键或存在安全风险，则必须执行全量测试以确保回归安全。

### 6.1 命令预算与升级条件

| 命令类别 | 典型命令 | 默认 timeout budget | 默认适用场景 | 升级条件 |
| :--- | :--- | :--- | :--- | :--- |
| 定向测试 | `pnpm test app-header` / `pnpm exec vitest run path/to/file.test.ts` | 10 分钟 | 单模块逻辑、组件、小范围修复 | 发现跨模块回归、接口契约变化或关键链路异常时升级到全量测试或 `verify` |
| 全量测试 | `pnpm test` | 30 分钟 | 周期性回归、大规模重构、关键逻辑变更 | 核心链路、权限、发布前收口或多类检查需要串联时升级到 `verify` |
| Coverage | `pnpm test:coverage` | 30 分钟 | 覆盖率治理、回归任务、核心模块补测 | 若覆盖率下滑或存在核心链路改动，应补充定向 / 全量测试结果一起提交 |
| Verify | `pnpm verify` | 60 分钟 | 发布前、跨模块流程、Hotfix 收口、需要含 E2E 的完整证据链 | 仅在需要串联 `lint + typecheck + test + e2e` 时使用，不作为普通小改动默认命令 |

补充约束：

1.  周期性回归任务可以执行上述 4 类命令，但必须在任务记录中写明预算、结果和未覆盖边界。
2.  `verify` 属于高成本命令，不得在普通文档改动或局部小修中默认执行。
3.  若命令超时，必须记录停止位置、已完成项与后续补跑计划。

## 7. 高效运行技巧 (Running Tips)
    # 仅运行 Header 组件测试
    pnpm test app-header

    # 仅运行 API Key 相关测试
    pnpm test api-key
    ```

2.  **临时跳过测试**:
    如果需要全量运行但也想避开特定的慢速测试（如 API/Database），可以使用 `describe.skip` 或 `it.skip` 临时跳过。

    ```typescript
    // tests/server/api/slow-test.test.ts
    describe.skip("Complex Database Operation", () => {
        // ...
    });
    ```

3.  **排查慢速测试**:
    若发现测试异常缓慢，请检查是否在每个 `test` 中重复进行了昂贵的数据库连接/销毁操作，应尽量利用 `beforeAll` 和 `afterAll`。

## 8. 提交前检查 (Pre-commit Checks)

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

3.  **测试检查**:
    -   默认执行与当前改动直接相关的**定向测试**。
    -   仅当命中“6. 高效测试策略”中的全量测试准入条件时，才要求执行全量 `pnpm run test`。
    -   若当前改动属于跨模块流程、发布前收口、高风险或跨模块 Hotfix，或需要 E2E 证据链的场景，则升级执行 `pnpm run verify`。
    ```bash
    # 默认：定向测试
    pnpm test app-header

    # 命中全量测试准入条件时
    pnpm run test

    # 命中完整收口条件时
    pnpm run verify
    ```
    -   确保本次改动所需的最低验证要求全部通过，而不是机械地一律执行全量测试。

**注意**: 任何未通过上述检查的提交将被视为不合规，CI 流水线将会拦截此类合并请求。

## 9. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](../plan/roadmap.md)
-   [开发规范](./development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
