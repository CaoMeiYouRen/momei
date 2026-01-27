# 迁移与集成设计文档 (Migration & Integration)

## 1. 概述 (Overview)

为了降低用户从现有博客系统（主要是 Hexo）迁移到墨梅的门槛，本设计包含两个核心部分：
1. **独立迁移工具 (Migration CLI)**：一个轻量级的脚本工具，用于本地解析 Markdown 文件并通过 API 导入。
2. **引导安装向导 (Installation Wizard)**：系统首运行时的初始化流程，集成迁移选项。

## 2. 独立迁移工具 (Momei CLI)

### 2.1 设计目标
- **解耦性能**：不增加主项目的依赖和逻辑负担。
- **批量导入**：支持递归扫描目录中的 `.md` 文件。
- **元数据保留**：精确解析 Front-matter（YAML），保留发布时间、分类、标签等。

### 2.2 技术栈
- **语言**：Node.js (TypeScript)。
- **核心库**：
  - `gray-matter`: 解析 Markdown Front-matter。
  - `axios`: 调用 Momei Open API。
  - `commander` / `cac`: CLI 命令解析。
  - `glob`: 文件匹配。

### 2.3 导入逻辑
1. 用户提供 `API Key` 和 `Site URL`。
2. 脚本扫描指定目录。
3. 对每个 `.md` 文件：
   - 解析 Front-matter。
   - 提取 `title`, `date` -> `createdAt`, `tags`, `categories` -> `category`, `slug` 等。
   - 移除 Front-matter 后的正文作为 `content`。
   - 调用 `POST /api/external/posts`。
4. 资源路径：暂不处理本地图片上传，建议用户先将图片托管至云端并确保 Markdown 中的 URL 为绝对路径。

## 3. 引导安装向导 (Installation Wizard)

### 3.1 触发机制
- 服务端增加一个检测接口或中间件：当数据库用户表为空且未配置核心管理员时，前端自动重定向至 `/onboarding`。

### 3.2 流程步骤
1. **环境自检**：显示数据库、Node 版本、环境参数检测结果。
2. **管理员创建**：设置第一个 Admin 账号（复用现有注册逻辑）。
3. **站点基本配置**：设置站点名称、描述、默认语言（存入数据库 `setting` 表）。
4. **数据迁移建议**（可选）：
   - 展示迁移工具的下载链接或使用说明。
   - 提供简单的单文件上传测试。
5. **完成锁定**：初始化完成后，在数据库记录 `initialized: true`，之后禁止访问向导。

## 4. 评估与影响 (Assessment)

### 4.1 工作量评估
- **CLI 工具**：预计 1-2 天。核心逻辑在于实现稳定、容错的 Front-matter 解析。
- **安装向导 (Onboarding)**：预计 3-5 天。
  - 需要开发全新的 `/onboarding` 页面（基于 PrimeVue Stepper 组件）。
  - 需要新增 `server/api/system/initialize` 相关接口，处理管理员创建、配置写入及“初始化锁定”逻辑。
  - 需要在 `App` 顶层增加重定向逻辑。

### 4.2 环境与配置改动 (Crucial)
为了支持向导，系统配置方案将进行如下调整：
1. **配置层级升级**：
   - 之前：`RuntimeConfig` 完全源自环境变量。
   - 之后：`RuntimeConfig` = `Merged(Environment, Database Settings)`.
2. **逻辑改动**：
   - 创建 `server/utils/settings.ts` 工具，用于在启动和请求时从数据库加载动态配置。
   - 修改 `nuxt.config.ts` 以支持部分配置的运行时注入。
   - **DB 覆盖原则**：如果数据库中存在同名配置且用户在向导中修改过，则以数据库为准（除非环境变量显式强制锁定）。

## 5. 待办计划

- [ ] 实现 `Momei CLI` 原型，验证与现 API 兼容性。
- [ ] 扩展 `Post` 模块支持更多元数据（如 `updatedAt`）。
- [ ] 开发引导向导首版 UI 框架。
