# AI 代理配置文档 (AGENTS.md)

## 1. 概述

本文档旨在规范墨梅博客项目中 AI 代理（Agents）与智能助手的配置、协作模式及行为准则，确保 AI 在高效辅助开发的同时符合项目的高质量标准。

## 2. 项目基本信息

-   **项目名称**: 墨梅博客 (Momei Blog)
-   **核心框架**: Nuxt 4.x (Vue 3.x + TypeScript)
-   **UI 设计**: SCSS (BEM) + PrimeVue
-   **包管理器**: PNPM
-   **开发约束**: ESLint + Stylelint + Conventional Commits + PDTFC 循环

## 3. AI 编程配置与指导

### 3.1 核心编程准则

AI 在生成或修改代码时，必须优先参考 [开发规范文档 - 代码生成准则](./docs/standards/development.md#25-代码生成准则-code-generation-guidelines)，确保在 TypeScript、Vue 风格、样式规范及国际化等方面的一致性。

### 3.2 技术栈偏好

在进行功能实现时，应优先使用项目中已集成的库和工具。详细的库使用清单请参考 [开发规范 - 技术栈指南](./docs/standards/development.md#3-技术栈与库使用指南-tech-stack--libraries)。

### 3.3 代码生成示例

针对常见的 Vue 组件实现及 API 路由编写，可参考 [开发规范 - 代码示例](./docs/standards/development.md#10-代码示例-code-examples) 获取最佳实践模板。

## 4. 协作工作流 (PDTFC+ 循环)

为了保证交付质量，任何功能开发任务必须严格遵循 PDTFC+ 融合工作流。该流程明确了从需求分析、开发执行、UI 验证、自动化测试到多次提交的完整闭环。

详细流程说明请查阅 [AI 协作规范](./docs/standards/ai-collaboration.md)。

## 5. AI 智能体体系 (AI Agents Matrix)

项目通过多智能体协同模式驱动开发，每个智能体拥有特定的角色定义与职责边界：

-   **核心编排**: `@full-stack-master` (全栈大师) - 负责全局任务分配与 PDTFC+ 2.0 流程控制。
-   **规划决策**: `@product-manager` (需求拆解、TODO 管理与文档维护)。
-   **业务执行**: `@frontend-developer` (Vue/SCSS/UI), `@backend-developer` (API/数据库/逻辑)。
-   **安全质量**: `@code-auditor` (代码审计、安全扫描与质量门禁)。
-   **质量保障**: `@test-engineer` (测试补全), `@ui-validator` (样式验证)。
-   **辅助工具**: `@qa-assistant` (只读问答), `@documentation-specialist` (文档维护)。

## 6. 安全与行为红线

### 6.1 核心文件保护

-   除非用户明确指示，严禁修改或删除 `.env` 及本文件 `AGENTS.md`。
-   严禁在代码中硬编码任何 API Key、Token 或敏感凭据。

### 6.2 终端操作安全

在执行脚本或命令前，必须进行环境检查与路径校验。具体的脚本安全准则请参考 [安全开发规范](./docs/standards/security.md#6-终端命令与自动化安全-cli--automation-security)。

## 7. 其他要求

1.  **多语言响应**: 在与用户沟通时，应使用用户发送的语言进行回复（默认为中文）。
2.  **重大变更确认**: 在进行涉及架构、核心逻辑或项目路线图的重大变更前，必须主动向用户请求确认。

## 8. 相关文档

-   **规划**: [项目路线图](./docs/plan/roadmap.md) | [待办事项](./docs/plan/todo.md)
-   **规范**: [开发规范](./docs/standards/development.md) | [安全规范](./docs/standards/security.md) | [API 规范](./docs/standards/api.md) | [测试规范](./docs/standards/testing.md) | [AI 协作规范](./docs/standards/ai-collaboration.md) | [文档规范](./docs/standards/documentation.md)
-   **设计**: [UI 设计](./docs/design/ui.md) | [API 设计](./docs/design/api.md) | [项目规划规范](./docs/standards/planning.md)
