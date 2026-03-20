# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
除此之外也请遵守 [AGENTS](./AGENTS.md) 中的相关指导。
始终使用用户发送的语言回复用户。

## 项目概览

**墨梅博客** - AI 驱动、原生国际化的开发者博客平台。

**AI 赋能，全球创作。**

墨梅博客 是一个基于 Nuxt 4 (Vue 3 + TypeScript) 构建的现代化博客平台。它专注于通过 AI 和深度国际化设计，为技术开发者提供极致的全球化创作体验。

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

## Claude 专属适配边界

本文件只负责 Claude Code 的平台适配说明，不再承担项目级规则定义职责。

**适配原则：**
- **唯一事实源**：必须优先读取 [AGENTS.md](./AGENTS.md)。项目级角色定义、工作流、安全红线与职责边界均以该文件为准。
- **冲突处理**：若本文件、目录镜像或其他平台说明与 `AGENTS.md` 存在冲突，一律以 `AGENTS.md` 为准。
- **允许补充的内容**：仅限 Claude Code 的目录发现顺序、工具能力差异、加载回退与降级策略。
- **不再在此重复维护清单**：智能体与技能清单以 `AGENTS.md` 和实际目录内容为准，不把本文件当作库存权威来源。

### Claude 目录发现与回退

- **主定义目录**：治理上以 `.github/agents/` 与 `.github/skills/` 为主定义；`.claude/` 仅作为 Claude Code 的发现入口镜像。
- **优先目录**：Claude Code 应优先读取 `.claude/agents/` 与 `.claude/skills/`。
- **回退目录**：若对应定义不存在，再回退读取 `.github/agents/` 与 `.github/skills/`。
- **镜像约束**：`.claude/` 中的文件名、职责边界和推荐路径必须与 `.github/` 主定义保持一致，不得单独重命名或扩展出第二套角色矩阵。
- **能力受限处理**：当 Claude Code 无法完整执行某项项目规则时，应显式说明能力缺口和回退做法，而不是改写项目规则本身。

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

## Claude 执行前检查

- 在进入任何写操作前，先按 [AGENTS.md](./AGENTS.md) 中的要求读取对应阶段必须参考的项目文档。
- 涉及模块级实现时，再从 `docs/design/`、`docs/guide/`、`docs/standards/` 中补读对应文档；本文件不再重复维护完整必读清单。
- 若 `.claude/` 目录中缺少某个 agent 或 skill 定义，按上文回退到 `.github/`，不要在本文件中手动补写镜像规则。

## 文档分类概览

### 核心规范文档
- `standards/` - 开发、测试、API、安全等规范文档
- `design/` - 架构和模块设计文档
- `plan/` - 项目计划和待办事项

### AI 适配目录
- `.claude/agents/`、`.claude/skills/` - Claude Code 优先读取的本地镜像目录。
- `.github/agents/`、`.github/skills/` - 当 `.claude/` 下不存在对应定义时使用的回退目录。
- 目录治理上以 `.github/` 为主定义，`.claude/` 只承担发现与兼容镜像职责。
- 具体 agent / skill 清单以目录实际内容和 [AGENTS.md](./AGENTS.md) 的角色矩阵为准，不在本文件重复维护副本。

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
