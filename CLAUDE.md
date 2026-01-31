# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
除此之外也请遵守 [AGENTS](./AGENTS.md) 中的相关指导。
始终使用用户发送的语言回复用户。

## 项目概览

**墨梅博客** - AI 驱动、原生国际化的开发者博客平台。

**AI 赋能，全球创作。**

墨梅 (Momei) 是一个基于 Nuxt 4 (Vue 3 + TypeScript) 构建的现代化博客平台。它专注于通过 AI 和深度国际化设计，为技术开发者提供极致的全球化创作体验。

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

**关键指令：**
- **必须优先读取 [AGENTS.md](./AGENTS.md)**：该文件包含了所有智能体的核心规范、PDTFC+ 循环细节以及安全红线。
- **自动发现与回退机制**：Claude Code 应优先通过 `.claude/agents/` 和 `.claude/skills/` 路径访问定义（如适用）。若不存在，请立即回退至 `.github/agents/` 和 `.github/skills/` 读取对应的 `.md` 文档。

### 核心智能体清单 (Agent List)
- **核心编排**：[@full-stack-master](.claude/agents/full-stack-master.agent.md)
- **规划设计**：[@product-manager](.claude/agents/product-manager.agent.md), [@system-architect](.claude/agents/system-architect.agent.md)
- **业务开发**：[@frontend-developer](.claude/agents/frontend-developer.agent.md), [@backend-developer](.claude/agents/backend-developer.agent.md)
- **质量验证**：[@quality-guardian](.claude/agents/quality-guardian.agent.md), [@ui-validator](.claude/agents/ui-validator.agent.md), [@test-engineer](.claude/agents/test-engineer.agent.md), [@code-reviewer](.claude/agents/code-reviewer.agent.md)
- **交付与辅助**：[@release-manager](.claude/agents/release-manager.agent.md), [@documentation-specialist](.claude/agents/documentation-specialist.agent.md), [@qa-assistant](.claude/agents/qa-assistant.agent.md)

### 核心技能清单 (Skill List)
- **工作流**：[full-stack-master](.claude/skills/full-stack-master/SKILL.md), [context-analyzer](.claude/skills/context-analyzer/SKILL.md)
- **规划分析**：[requirement-analyst](.claude/skills/requirement-analyst/SKILL.md), [technical-architect](.claude/skills/technical-architect/SKILL.md)
- **代码实现**：[vue-frontend-expert](.claude/skills/vue-frontend-expert/SKILL.md), [nitro-backend-expert](.claude/skills/nitro-backend-expert/SKILL.md), [nuxt-code-editor](.claude/skills/nuxt-code-editor/SKILL.md)
- **质量与安全**：[quality-guardian](.claude/skills/quality-guardian/SKILL.md), [test-engineer](.claude/skills/test-engineer/SKILL.md), [code-reviewer](.claude/skills/code-reviewer/SKILL.md), [security-guardian](.claude/skills/security-guardian/SKILL.md)
- **UI 验证**：[ui-validator](.claude/skills/ui-validator/SKILL.md)
- **交付维护**：[git-flow-manager](.claude/skills/git-flow-manager/SKILL.md), [conventional-committer](.claude/skills/conventional-committer/SKILL.md), [documentation-specialist](.claude/skills/documentation-specialist/SKILL.md), [devops-specialist](.claude/skills/devops-specialist/SKILL.md)

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
- `.claude/agents/` - 各智能体的详细配置文档
  - [全栈大师](.claude/agents/full-stack-master.agent.md)
  - [产品经理](.claude/agents/product-manager.agent.md)
  - [系统架构师](.claude/agents/system-architect.agent.md)
  - [前端开发者](.claude/agents/frontend-developer.agent.md)
  - [后端开发者](.claude/agents/backend-developer.agent.md)
  - [质量守卫](.claude/agents/quality-guardian.agent.md)
  - [UI 验证器](.claude/agents/ui-validator.agent.md)
  - [测试工程师](.claude/agents/test-engineer.agent.md)
  - [代码审查者](.claude/agents/code-reviewer.agent.md)
  - [发布管理员](.claude/agents/release-manager.agent.md)
  - [文档专家](.claude/agents/documentation-specialist.agent.md)
  - [问答助手](.claude/agents/qa-assistant.agent.md)
- `.claude/skills/` - 各智能体技能的实现文档
  - [全栈大师技能](.claude/skills/full-stack-master/SKILL.md)
  - [需求分析技能](.claude/skills/requirement-analyst/SKILL.md)
  - [技术架构技能](.claude/skills/technical-architect/SKILL.md)
  - [Vue 前端技能](.claude/skills/vue-frontend-expert/SKILL.md)
  - [Nitro 后端技能](.claude/skills/nitro-backend-expert/SKILL.md)
  - [上下文分析技能](.claude/skills/context-analyzer/SKILL.md)
  - [测试工程技能](.claude/skills/test-engineer/SKILL.md)
  - [质量守卫技能](.claude/skills/quality-guardian/SKILL.md)
  - [安全守护技能](.claude/skills/security-guardian/SKILL.md)
  - [UI 验证技能](.claude/skills/ui-validator/SKILL.md)
  - [Git 流管理](.claude/skills/git-flow-manager/SKILL.md)
  - [规范提交技能](.claude/skills/conventional-committer/SKILL.md)
  - [文档专家技能](.claude/skills/documentation-specialist/SKILL.md)
  - [DevOps 技能](.claude/skills/devops-specialist/SKILL.md)

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
