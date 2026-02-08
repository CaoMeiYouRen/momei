# 第三方平台集成设计文档 (Third-party Platform Integration)

## 1. 概述 (Overview)

为了实现“一次创作，全网分发”的目标，墨梅需要与外部主流内容平台及工具链进行集成。本设计涵盖了目前最受开发者欢迎的两个集成方向：
1. **Wechatsync (文章同步助手)**：通过浏览器插件生态，将博文一键同步至知乎、头条、公众号等 20+ 平台。
2. **Memos (碎片化记录)**：将博文或摘要同步至个人的 Memos 实例，实现碎片化知识管理。

## 2. Wechatsync 集成 (Multi-platform Sync)

### 2.1 技术方案
- **核心内核**：使用官方提供的 `article-syncjs` SDK。
- **集成模式**：客户端注入。在管理后台检测到用户安装了“文章同步助手”扩展时，通过 SDK 拉起同步对话框。
- **数据流向**：Momei Backend -> Momei Frontend (SDK) -> Browser Extension -> Third-party Platforms.

### 2.2 用户工作流
1. 用户在文章编辑页或管理列表页点击“推送到多平台”。
2. 前端组件加载 `article-syncjs`。
3. 调用 `window.syncPost` 接口，传入当前文章的 `title`, `content` (Markdown 或 HTML), `summary`, `tags`, `cover` 等元数据。
4. “文章同步助手”插件弹出，用户选择目标平台并启动同步任务。

### 2.3 核心实现点
- **动态加载**：仅在用户触发时加载外部 SDK 脚本，避免影响首屏性能。
- **内容适配**：
    - Markdown 转换：确保图片 URL 为绝对路径。
    - 摘要生成：若博文无摘要，自动截取前 100 字。

## 3. Memos 集成 (Memos Integration)

### 3.1 技术方案
- **核心内核**：利用 Memos API v1 协议。
- **集成模式**：服务端代理 (Server-to-Server)。
- **认证方式**：使用用户在 Memos 中生成的 `Access Token` (API Key)。

### 3.2 功能特性
- **自动同步**：在发布博文时，可选同步至 Memos。
- **内容格式**：
    - 全文模式：同步文章标题、摘要及链接。
    - 碎片模式：仅同步摘要及 #Momei 标签。
- **可见性控制**：支持同步时指定 Memos 的可见性（PUBLIC / PROTECTED / PRIVATE）。

### 3.3 配置管理
在系统设置中支持：
- `MEMOS_INSTANCE_URL`: 目标 Memos 实例地址（如 `https://memos.example.com`）。
- `MEMOS_ACCESS_TOKEN`: 安全存储的 API 密钥。
- `MEMOS_DEFAULT_VISIBILITY`: 默认可见性设置。

## 4. 评估与影响 (Assessment)

### 4.1 风险分析
- **Wechatsync**：依赖外部插件的稳定性。如果插件版本重大重构（如 v3 manifest），SDK 可能需要更新。
- **Memos**：API 变动风险。由于 Memos 仍在活跃迭代，需兼容 v1 版本的 API 规范（基于 Google API 设计准则）。

### 4.2 扩展性
- **Webhooks**：未来可支持 Momei 接收来自 Memos 的 Webhook，实现将 Memos 内容集成到博客的“动态/说说”栏目。

## 5. 待办计划

- [ ] 在 `components/admin/` 下创建 `third-party-sync-manager.vue` 用于 Wechatsync 触发。
- [ ] 在 `server/utils/memos.ts` 实现 Memos API 封装。
- [ ] 在 `pages/admin/settings.vue` 增加“第三方集成”配置项。
- [ ] 配合 `Article` 管理逻辑，增加同步状态追踪。
