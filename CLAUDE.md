# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
除此之外也请遵守 [AGENTS](./AGENTS.md) 中的相关指导。
始终使用用户发送的语言回复用户。

## 项目概览

墨梅 (Momei) 是一个基于 Nuxt 4 (Vue 3 + TypeScript) 构建的现代化、高性能、国际化的博客平台。专为技术开发者和跨境内容创作者设计，提供无缝迁移、多语言内容管理、Markdown 编辑和 AI 辅助内容创作等功能。

## 常用命令

### 开发
- `pnpm dev` - 启动开发服务器并自动打开浏览器
- `pnpm build` - 构建生产版本
- `pnpm generate` - 生成静态站点
- `pnpm preview` - 预览构建后的应用

### 测试
- `pnpm test` - 运行所有测试
- `pnpm test:coverage` - 运行测试并生成覆盖率报告
- 运行单个测试: `pnpm vitest run path/to/test-file.test.ts`

### 代码质量
- `pnpm lint` - 运行 ESLint 并自动修复
- `pnpm lint:css` - 运行 Stylelint 并自动修复
- `pnpm typecheck` - 运行 TypeScript 类型检查

### 文档
- `pnpm docs:dev` - 启动文档开发服务器
- `pnpm docs:build` - 构建文档
- `pnpm docs:preview` - 预览构建后的文档

## 架构概览

### 前端 (Nuxt 4)
- **框架**: Nuxt 4 + Vue 3 + TypeScript
- **UI 组件库**: PrimeVue 配合自定义主题
- **状态管理**: Vue Composition API 配合 composables
- **路由**: 基于文件的路由系统 (`pages/`)
- **组件**: 可复用的 Vue 组件 (`components/`)
- **布局**: 页面布局模板 (`layouts/`)
- **样式**: SCSS 配合 BEM 命名规范 (`styles/`)

### 后端 (Nitro 服务端)
- **API 路由**: 基于 H3 的 API 接口 (`server/api/`)
- **服务端路由**: 非 API 服务端路由 (`server/routes/`)
- **数据库**: TypeORM 配合实体定义 (`server/entities/`)
- **服务层**: 业务逻辑处理 (`server/services/`)
- **中间件**: 服务端中间件 (`server/middleware/`)
- **插件**: 服务端插件 (`server/plugins/`)

### 数据层
- **ORM**: TypeORM 支持 SQLite/MySQL/PostgreSQL
- **实体**: 数据库模型定义在 `server/entities/` (文章、用户、分类、标签、评论等)
- **迁移**: 由 TypeORM 自动处理
- **存储**: 支持多种存储后端 (本地、S3、Vercel Blob)

### 认证系统
- **库**: Better-Auth 配合丰富的插件支持
- **功能**: 用户名/邮箱密码、OAuth、双因素认证、魔法链接、手机号认证等
- **客户端**: `lib/auth-client.ts` 中的 `authClient` 用于前端认证操作

### 国际化
- **库**: `@nuxtjs/i18n`
- **语言**: 英语 (en-US) 和中文 (zh-CN)
- **文件**: `locales/` 目录中的 JSON 语言文件
- **使用**: 通过 `$t()` 函数进行翻译

### AI 集成
- **提供者**: OpenAI、Anthropic 和模拟提供者
- **服务**: `server/services/ai.ts` 中的 AI 内容处理服务
- **工具**: `server/utils/ai/` 中的 AI 工具函数

### 测试
- **框架**: Vitest 配合 Nuxt Test Utils
- **环境**: Nuxt 测试环境
- **配置**: `vitest.config.ts` 和 `tests/testSetup.ts`
- **覆盖率**: Istanbul 覆盖率报告

## 智能体和技能集成

本项目定义了完整的 AI 智能体体系，支持 Claude Code 与 GitHub Copilot 跨工具复用。

**Claude Code 特别指引：**
- **路径优先级**：请优先通过 `.claude/agents/` 和 `.claude/skills/` 路径访问相关定义。
- **回退机制**：若上述路径不可用或链接失效，请立即回退至 `.github/agents/` 和 `.github/skills/` 读取原始 Markdown 文档并遵循其中的指令执行。

### 核心智能体
- [@full-stack-master](.claude/agents/full-stack-master.agent.md) - 全栈大师，驱动完整的 PDTFC+ 开发循环 (回退至 [.github/agents](.github/agents/full-stack-master.agent.md))
- [@full-stack-developer](.claude/agents/full-stack-developer.agent.md) - 全栈开发者，专注于具体实现 (回退至 [.github/agents](.github/agents/full-stack-developer.agent.md))
- [@quality-guardian](.claude/agents/quality-guardian.agent.md) - 质量守卫，负责代码检查和规范审查 (回退至 [.github/agents](.github/agents/quality-guardian.agent.md))
- [@test-engineer](.claude/agents/test-engineer.agent.md) - 测试工程师，负责测试驱动开发 (回退至 [.github/agents](.github/agents/test-engineer.agent.md))
- [@code-reviewer](.claude/agents/code-reviewer.agent.md) - 代码审查者，负责代码审查和安全审计 (回退至 [.github/agents](.github/agents/code-reviewer.agent.md))
- [@documentation-specialist](.claude/agents/documentation-specialist.agent.md) - 文档专家，维护设计和规划文档 (回退至 [.github/agents](.github/agents/documentation-specialist.agent.md))
- [@qa-assistant](.claude/agents/qa-assistant.agent.md) - 问答助手，提供项目解答 (回退至 [.github/agents](.github/agents/qa-assistant.agent.md))

### 核心技能
- [full-stack-master](.claude/skills/full-stack-master/SKILL.md) - 全栈大师工作流技能
- [context-analyzer](.claude/skills/context-analyzer/SKILL.md) - 上下文分析技能
- [nuxt-code-editor](.claude/skills/nuxt-code-editor/SKILL.md) - Nuxt 代码编辑技能
- [test-engineer](.claude/skills/test-engineer/SKILL.md) - 测试工程技能
- [quality-guardian](.claude/skills/quality-guardian/SKILL.md) - 质量守卫技能
- [documentation-specialist](.claude/skills/documentation-specialist/SKILL.md) - 文档专家技能
- [code-reviewer](.claude/skills/code-reviewer/SKILL.md) - 代码审查技能
- [conventional-committer](.claude/skills/conventional-committer/SKILL.md) - 规范提交技能

## 关键模式和约定

### 文件结构
```
components/     # Vue 组件
pages/          # 基于文件的路由
layouts/        # 页面布局
server/         # 服务端代码
  api/          # API 接口
  entities/     # 数据库实体
  services/     # 业务逻辑
  utils/        # 服务端工具函数
lib/            # 共享库
utils/          # 客户端工具函数
types/          # TypeScript 类型定义
styles/         # SCSS 样式
locales/        # 国际化语言文件
tests/          # 测试文件
```

### API 设计
- RESTful 接口位于 `server/api/`
- 基于路径的路由 (例如: `server/api/posts/[id].get.ts`)
- 标准响应格式包含 `code`、`data` 和可选的 `message`
- 认证和授权中间件

### 数据库实体
- 使用 TypeORM 装饰器定义的实体
- 使用自定义列装饰器确保字段定义一致性
- 使用 TypeORM 装饰器定义关系
- 基础实体包含通用字段 (id, createdAt, updatedAt)

### 组件开发
- 使用 `<script setup lang="ts">` 语法
- SCSS 配合 scoped 样式
- 国际化集成使用 `$t()` 函数
- PrimeVue 组件使用

## 强制参考文档 (Mandatory Reading for AI Agents)

在执行任务时，AI 智能体**必须**在特定阶段主动读取以下文档以确保符合项目标准：

### 任务开始前必须阅读
- [项目计划](./docs/plan/roadmap.md) - 了解整体发展蓝图和目标
- [待办事项](./docs/plan/todo.md) - 明确当前任务、目标及优先级
- [待办事项归档](./docs/plan/todo-archive.md) - 了解已归档的历史任务
- [项目规划规范](./docs/standards/planning.md) - 任务规划与评估标准

### 进入开发 (Do) 阶段前必须阅读
- [开发规范](./docs/standards/development.md) - 代码风格、目录结构和安全要求
- [API 规范](./docs/standards/api.md) - API 设计、响应格式和权限控制
- [数据库设计](./docs/design/database.md) - 数据库实体关系和数据模型

### 涉及安全性或权限时必须阅读
- [安全规范](./docs/standards/security.md) - 安全最佳实践和漏洞防范
- [API 设计](./docs/design/api.md) - 后端架构和认证系统设计

### 执行测试 (Test) 或补齐测试 (Enhance) 前必须阅读
- [测试规范](./docs/standards/testing.md) - 测试策略和覆盖率要求

### 涉及 UI 变动时必须阅读
- [UI 设计](./docs/design/ui.md) - 整体界面设计风格和组件规范
- [主题系统设计](./docs/design/modules/theme-system.md) - 主题切换和自定义机制

### 涉及特定模块功能时必须阅读
- **博客模块**: [博客模块设计](./docs/design/modules/blog.md)
- **AI 模块**: [AI 模块设计](./docs/design/modules/ai.md) 和 [AI 开发指南](./docs/guide/ai-development.md)
- **认证模块**: [认证模块设计](./docs/design/modules/auth.md)
- **管理模块**: [管理模块设计](./docs/design/modules/admin.md)
- **灵感采集**: [灵感引擎设计](./docs/design/modules/inspiration.md)
- **播客模块**: [播客模块设计](./docs/design/modules/podcast.md)
- **用户模块**: [用户模块设计](./docs/design/modules/user.md)
- **分类标签**: [分类标签模块设计](./docs/design/modules/taxonomy.md)
- **搜索模块**: [搜索模块设计](./docs/design/modules/search.md)
- **存储模块**: [存储模块设计](./docs/design/modules/storage.md)
- **交互模块**: [交互模块设计](./docs/design/modules/interactions.md)
- **渲染模块**: [渲染模块设计](./docs/design/modules/rendering.md)
- **演示模式**: [演示模式模块设计](./docs/design/modules/demo-mode.md)
- **部署优化**: [部署优化模块设计](./docs/design/modules/deployment-optimization.md)
- **开放 API**: [开放 API 模块设计](./docs/design/modules/open-api.md)
- **系统模块**: [系统模块设计](./docs/design/modules/system.md)

### AI 协作规范
- [AI 协作规范](./docs/standards/ai-collaboration.md) - AI 智能体工作流程和规范
- [智能体配置](./AGENTS.md) - 所有智能体的职责和交互规范

## 文档分类概览

### 核心规范文档
- `standards/` - 开发、测试、API、安全等规范文档
- `design/` - 架构和模块设计文档
- `plan/` - 项目计划和待办事项

### AI 智能体文档
- `.claude/agents/` (软链接) 或 `.github/agents/` - 各智能体的详细配置文档
  - [全栈大师](.claude/agents/full-stack-master.agent.md) - 驱动完整的 PDTFC+ 开发循环
  - [全栈开发者](.claude/agents/full-stack-developer.agent.md) - 专注于具体实现
  - [质量守卫](.claude/agents/quality-guardian.agent.md) - 代码检查和规范审查
  - [测试工程师](.claude/agents/test-engineer.agent.md) - 测试驱动开发
  - [代码审查者](.claude/agents/code-reviewer.agent.md) - 代码审查和安全审计
  - [文档专家](.claude/agents/documentation-specialist.agent.md) - 维护设计和规划文档
  - [问答助手](.claude/agents/qa-assistant.agent.md) - 提供项目解答
- `.claude/skills/` (软链接) 或 `.github/skills/` - 各智能体技能的实现文档
  - [全栈大师技能](.claude/skills/full-stack-master/SKILL.md)
  - [上下文分析技能](.claude/skills/context-analyzer/SKILL.md)
  - [Nuxt 代码编辑技能](.claude/skills/nuxt-code-editor/SKILL.md)
  - [测试工程技能](.claude/skills/test-engineer/SKILL.md)
  - [质量守卫技能](.claude/skills/quality-guardian/SKILL.md)
  - [文档专家技能](.claude/skills/documentation-specialist/SKILL.md)
  - [代码审查技能](.claude/skills/code-reviewer/SKILL.md)
  - [规范提交技能](.claude/skills/conventional-committer/SKILL.md)
  - [UI 验证技能](.claude/skills/ui-validator/SKILL.md)

### 其他重要文件
- `.github/PULL_REQUEST_TEMPLATE.md` - 代码合并请求模板
- `database/README.md` - 数据库配置和迁移指南
- `CONTRIBUTING.md` - 贡献者指南和开发流程
- `CODE_OF_CONDUCT.md` - 社区行为准则

### 开发指南
- `guide/` - 开发指南和部署文档
- `database/README.md` - 数据库配置和迁移指南

### 项目文件
- `AGENTS.md` - AI 代理配置和开发工作流程
- `CONTRIBUTING.md` - 贡献者指南
- `CODE_OF_CONDUCT.md` - 行为准则
