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

本项目定义了完整的 AI 智能体体系，可直接复用:

### 核心智能体
- [@full-stack-master](./.github/agents/full-stack-master.agent.md) - 全栈大师，驱动完整的 PDTFC+ 开发循环
- [@full-stack-developer](./.github/agents/full-stack-developer.agent.md) - 全栈开发者，专注于具体实现
- [@quality-guardian](./.github/agents/quality-guardian.agent.md) - 质量守卫，负责代码检查和规范审查
- [@test-engineer](./.github/agents/test-engineer.agent.md) - 测试工程师，负责测试驱动开发
- [@code-reviewer](./.github/agents/code-reviewer.agent.md) - 代码审查者，负责代码审查和安全审计
- [@documentation-specialist](./.github/agents/documentation-specialist.agent.md) - 文档专家，维护设计和规划文档
- [@qa-assistant](./.github/agents/qa-assistant.agent.md) - 问答助手，提供项目解答

### 核心技能
- [full-stack-master](./.github/skills/full-stack-master/SKILL.md) - 全栈大师工作流技能
- [context-analyzer](./.github/skills/context-analyzer/SKILL.md) - 上下文分析技能
- [nuxt-code-editor](./.github/skills/nuxt-code-editor/SKILL.md) - Nuxt 代码编辑技能
- [test-engineer](./.github/skills/test-engineer/SKILL.md) - 测试工程技能
- [quality-guardian](./.github/skills/quality-guardian/SKILL.md) - 质量守卫技能
- [documentation-specialist](./.github/skills/documentation-specialist/SKILL.md) - 文档专家技能
- [code-reviewer](./.github/skills/code-reviewer/SKILL.md) - 代码审查技能
- [conventional-committer](./.github/skills/conventional-committer/SKILL.md) - 规范提交技能

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
