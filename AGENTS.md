# AI 代理配置文档 (AGENTS.md)

## 1. 概述

本文档旨在规范墨梅博客项目中 AI 代理（Agents）与智能助手的配置、协作模式及行为准则，确保 AI 在高效辅助开发的同时符合项目的高质量标准。

## 2. 权威事实源与冲突处理顺序

-   `AGENTS.md` 是平台无关的唯一权威事实源，负责定义项目级 AI 行为准则、职责边界、PDTFC+ 工作流与安全红线。
-   `CLAUDE.md`、各类 Rules / Instructions 入口、`docs/guide/ai-development.md` 与其他平台适配文档仅承担工具适配、开发者引导与差异补充说明，不得与 `AGENTS.md` 并列定义核心规则。
-   冲突处理顺序如下：
	1. `AGENTS.md` 与其显式引用的项目规范文档（如规划、开发、安全、测试规范）。
	2. 平台专属适配文件中与工具能力、加载顺序、目录回退相关的补充说明。
	3. 开发入口说明（如 `README.md`、文档站导航、开发指南）中的导览性提示。
-   若平台能力受限，只允许补充“工具差异、降级策略与回退路径”，不得覆盖或改写项目级行为准则。

## 3. 项目基本信息

-   **项目名称**: 墨梅博客 (Momei Blog)
-   **核心框架**: Nuxt 4.x (Vue 3.x + TypeScript)
-   **UI 设计**: SCSS (BEM) + PrimeVue
-   **包管理器**: PNPM
-   **开发约束**: ESLint + Stylelint + Conventional Commits + PDTFC 循环

### 3.1 常用命令

| 分类 | 命令 | 说明 |
|------|------|------|
| 开发 | `pnpm dev` | 启动开发服务器并自动打开浏览器 |
| 开发 | `pnpm build` | 构建生产版本 |
| 开发 | `pnpm generate` | 生成静态站点 |
| 开发 | `pnpm preview` | 预览构建后的应用 |
| 测试 | `pnpm test` | 运行所有测试 |
| 测试 | `pnpm test:coverage` | 运行测试并生成覆盖率报告 |
| 质量 | `pnpm lint` | 运行 ESLint 并自动修复 |
| 质量 | `pnpm lint:i18n` | 单独运行 `@intlify/vue-i18n` 相关慢规则校验 |
| 质量 | `pnpm lint:css` | 运行 Stylelint 并自动修复 |
| 质量 | `pnpm typecheck` | 运行 TypeScript 类型检查 |
| 文档 | `pnpm docs:dev` | 启动文档开发服务器 |
| 文档 | `pnpm docs:build` | 构建文档 |
| 文档 | `pnpm docs:preview` | 预览构建后的文档 |

## 4. AI 编程配置与指导

### 4.1 核心编程准则

AI 在生成或修改代码时，必须优先参考 [开发规范文档 - 代码生成准则](./docs/standards/development.md#25-代码生成准则-code-generation-guidelines)，确保在 TypeScript、Vue 风格、样式规范及国际化等方面的一致性。

### 4.2 技术栈偏好

在进行功能实现时，应优先使用项目中已集成的库和工具。详细的库使用清单请参考 [开发规范 - 技术栈指南](./docs/standards/development.md#3-技术栈与库使用指南-tech-stack--libraries)。

### 4.3 代码生成示例

针对常见的 Vue 组件实现及 API 路由编写，可参考 [开发规范 - 代码示例](./docs/standards/development.md#10-代码示例-code-examples) 获取最佳实践模板。

### 4.4 Agent-First 方法论

本项目默认采用 Agent-First 的协作方式：用户应直接把目标交给 Agent，而不需要先区分 script、skill 和 agent；一次性需求由 Agent 直接完成，可复用流程由 Agent 沉淀为 skill，具体自动化步骤再下沉为 skill 内部的 script 或脚本资产。对于反复出现的高频任务，Agent 应结合历史记忆主动抽象稳定输入、边界和步骤，持续演化既有 skills，而不是长期依赖用户重复描述同一类工作流。

## 5. 协作工作流 (PDTFC+ 循环)

为了保证交付质量，任何功能开发任务必须严格遵循 PDTFC+ 融合工作流。该流程明确了从需求分析、开发执行、UI 验证、自动化测试到多次提交的完整闭环。

详细流程说明请查阅 [AI 协作规范](./docs/standards/ai-collaboration.md)。

## 6. AI 智能体体系 (AI Agents Matrix)

项目通过多智能体协同模式驱动开发，但每个阶段必须有明确唯一的主责角色，避免多个智能体在同一阶段重复承担同类职责。

| 智能体 | 适用场景 | 典型输入 | 主要输出 | 必经交接点 | 不应承担 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `@full-stack-master` | 本项目默认的开发主责角色；负责统一考虑需求、方案、前后端实现与收口，或编排复杂跨阶段任务 | 用户目标、`todo.md` / `roadmap.md`、受影响文件范围 | 准入结论、阶段拆解、全栈代码改动、交接计划、收口说明 | 需求不清时先交 `@product-manager`；代码落地后交 `@code-auditor`，按需继续交 `@ui-validator` / `@test-engineer` / `@documentation-specialist` | 不应绕过专项审计、测试和文档收口直接宣布完成 |
| `@product-manager` | 需求澄清、插队分流、验收标准定义、Todo/Roadmap 维护 | 用户原始需求、`todo.md`、`roadmap.md`、`todo-archive.md` | 范围判定、验收标准、任务拆解、规划更新 | 需求明确后交 `@full-stack-master` 或对应开发角色 | 不应承担代码实现、最终审计或测试编写 |
| `@frontend-developer` | 已被明确切分的前端局部实现、样式修补、UI 细节专项 | 已批准方案、UI 设计、受影响页面/组件清单 | 前端代码、自检记录、UI 风险提示 | 代码改动必须交 `@code-auditor`；涉及界面时继续交 `@ui-validator` | 不应承担跨栈统一方案设计、需求分流、后端权限逻辑或最终 Review Gate |
| `@backend-developer` | 已被明确切分的后端局部实现、接口/数据库专项修补 | 已批准方案、API / 数据模型约束、受影响接口清单 | 后端代码、数据结构调整、自检记录 | 代码改动必须交 `@code-auditor`；测试补强交 `@test-engineer` | 不应承担跨栈统一方案设计、产品规划、视觉验收或替代测试收口 |
| `@code-auditor` | 所有代码改动完成后的 Review Gate | 代码 diff、Todo 验收点、Lint/Typecheck/Test 结果 | 审计结论、问题分级、放行或退回建议 | Pass 后才能进入提交或后续验证；Reject 时退回对应开发者 | 不应承担需求定义、功能开发主责或测试增强主责 |
| `@ui-validator` | 页面可视化变更后的浏览器验证、响应式/主题验证 | 已实现界面、运行入口、受影响页面列表 | 验证记录、截图/结论、回退问题清单 | UI 通过后交 `@test-engineer` 或回到开发者修复 | 不应承担业务逻辑实现、产品规划或替代自动化测试 |
| `@test-engineer` | 测试补强、回归验证、覆盖率提升 | 已批准行为、改动模块、覆盖率缺口、预算约束 | 新增/修正测试、运行结果、剩余风险说明 | 测试代码变更仍需交 `@code-auditor` 审看 | 不应承担需求规划、视觉验收或无限制全量测试 |
| `@documentation-specialist` | 设计文档、规范文档、README/Guide/Plan 同步 | 已确认的实现结论、规划变化、需同步的文档范围 | 文档更新、原文回链、同步说明 | 规划类文档与 `@product-manager` 对齐；代码相关文档与对应开发/审计结果对齐 | 不应虚构未实现能力或替代产品验收 |
| `@qa-assistant` | 只读问答、代码/文档检索、架构解释 | 用户问题、目标模块、搜索范围 | 证据化回答、定位结果、推荐阅读路径 | 如需修改代码或文档，应转交对应执行角色 | 严禁修改代码、配置或规划文档 |

### 6.1 默认推荐路径

1.  需求不清、验收标准缺失或怀疑插队时，优先交给 `@product-manager` 做范围判断。
2.  代码实现阶段默认由 `@full-stack-master` 统一负责需求理解、方案设计与前后端落地；仅当任务边界已经被明确切分时，才交 `@frontend-developer` 或 `@backend-developer` 处理局部专项。
3.  任何代码改动收尾都必须进入 `@code-auditor` Review Gate，不能用“已本地验证”替代审计结论。
4.  涉及实际页面或交互渲染的改动，再交 `@ui-validator` 做浏览器验证。
5.  测试补强、覆盖率治理与回归验证由 `@test-engineer` 主责承担。
6.  设计、规范、README、Guide 与 Plan 文档同步由 `@documentation-specialist` 承担，但规划类条目仍需与 `@product-manager` 对齐。

### 6.2 阶段去重规则

-   **P (Plan)**：由 `@product-manager` 主责，其他角色只提供上下文，不替代准入判断。
-   **D (Do)**：同一事项在同一时点只能有一个代码实现主责角色；本项目默认由 `@full-stack-master` 统筹实现，只有在边界已经稳定切分时才拆给前后端专项角色。
-   **A (Audit)**：`@code-auditor` 是唯一 Review Gate 负责人，开发者自检不等于审计通过。
-   **V (Validate)**：`@ui-validator` 主责浏览器验证；`@test-engineer` 不替代 UI 可视审计。
-   **T (Test)**：`@test-engineer` 主责测试补强；`@code-auditor` 只审计测试质量，不替代测试设计。
-   **F (Finish)**：`@documentation-specialist` 与 `@product-manager` 负责文档和待办闭环，但不回写未确认的产品结论。

### 6.3 主定义、镜像与 Skills 复用治理

-   `.github/agents/` 与 `.github/skills/` 是项目内 agent / skill 的主定义目录，负责维护角色名、职责边界、引用关系与推荐路径。
-   `.claude/agents/` 与 `.claude/skills/` 是 Claude 发现入口的兼容镜像，必须与 `.github/` 保持同名、同库存、同职责边界，不得独立发明另一套角色体系。
-   Agent 文件应优先引用既有 skills 与项目规范文档，只保留角色定位、输入输出、交接点和禁区；PDTFC+ 全流程、Lint/Typecheck/Test 门禁及专项规则应沉淀在 `AGENTS.md`、专项 skills 与规范文档中，不再在多个 agent 文件里重复抄写。
-   任何 agent / skill 库存变更，都应同步更新 `AGENTS.md`、平台适配入口文档，以及受影响的 `.github/` / `.claude/` 镜像文件，避免角色名、路径和 fallback 约定漂移。

### 6.4 CLAUDE.md 维护约定

-   `CLAUDE.md` 由 `@documentation-specialist` 负责维护
-   每次 `AGENTS.md` 重大变更后，应同步检查 `CLAUDE.md` 是否需要精简
-   `CLAUDE.md` 只保留平台适配内容（目录发现顺序、工具差异、回退策略），不重复项目级规则
-   `CLAUDE.md` 不得定义层级（L0/L1/L2/L3）或包含 PDTFC+ 工作流详情，应引用 `AGENTS.md` 或对应规范文档

## 7. 安全与行为红线

### 7.1 核心文件保护

-   严禁修改或删除 `.env`，非必要也不得读取 `.env`，应当优先参考 `.env.full.example` 了解环境变量字段。
-   修改本文件 `AGENTS.md` 前应该询问用户，并得到用户明确指示。
-   严禁在代码中硬编码任何 API Key、Token 或敏感凭据。

### 7.2 终端操作安全

在执行脚本或命令前，必须进行环境检查与路径校验。具体的脚本安全准则请参考 [安全开发规范](./docs/standards/security.md#6-终端命令与自动化安全-cli--automation-security)。

### 7.3 Git 工作树与隔离 (Git Worktree & Isolation)

AI 代理应具备”多分支意识”，根据任务属性在对应的工作树中执行任务。详细规范请参阅 [Git 工作流规范](./docs/standards/git.md)。

- 严禁在未经授权的情况下跨工作树修改不属于该范畴的代码。

## 8. 其他要求

1.  **多语言响应**: 在与用户沟通时，应使用用户发送的语言进行回复（默认为中文）。
2.  **重大变更确认**: 在进行涉及架构、核心逻辑或项目路线图的重大变更前，必须主动向用户请求确认。
3.  **性能下限原则**：使用的 AI 智能体，其基础能力不应低于 Gemini 3 Flash / Claude Sonnet 4.5 / GPT-5 这一档的大模型水平。

## 9. 相关文档

-   **规划**: [项目路线图](./docs/plan/roadmap.md) | [待办事项](./docs/plan/todo.md)
-   **规范**: [开发规范](./docs/standards/development.md) | [Git 规范](./docs/standards/git.md) | [安全规范](./docs/standards/security.md) | [API 规范](./docs/standards/api.md) | [测试规范](./docs/standards/testing.md) | [AI 协作规范](./docs/standards/ai-collaboration.md) | [文档规范](./docs/standards/documentation.md)
-   **设计**: [UI 设计](./docs/design/ui.md) | [API 设计](./docs/design/api.md) | [项目规划规范](./docs/standards/planning.md)
-   **适配与入口**: [Claude 适配说明](./CLAUDE.md) | [AI 协同开发指南](./docs/guide/ai-development.md) | [项目主页入口](./README.md)
