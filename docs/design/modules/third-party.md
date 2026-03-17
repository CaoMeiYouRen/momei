# 第三方平台集成设计文档 (Third-party Platform Integration)

## 1. 概述 (Overview)

为了实现“一次创作，全网分发”的目标，墨梅需要与外部主流内容平台及工具链进行集成。本设计涵盖了目前最受开发者欢迎的两个集成方向：
1. **Wechatsync (文章同步助手)**：通过浏览器插件生态，将博文一键同步至知乎、头条、公众号等 20+ 平台。
2. **Memos (碎片化记录)**：将博文或摘要同步至个人的 Memos 实例，实现碎片化知识管理。
3. **listmonk (Newsletter 外部分发)**：将文章生成的营销 Campaign 分发到 listmonk，由其负责订阅者列表与实际投递。

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
- **Markdown 处理**: 自动处理本地存储图片路径到完整 URL 地址。

### 3.3 配置管理
在系统设置中支持：
- `MEMOS_INSTANCE_URL`: 目标 Memos 实例地址（如 `https://memos.example.com`）。
- `MEMOS_ACCESS_TOKEN`: 安全存储的 API 密钥。
- `MEMOS_DEFAULT_VISIBILITY`: 默认可见性设置。
- `MEMOS_ENABLED`: 是否启用同步功能。

### 3.4 核心实现 (Implementation)
当前实现已经形成以下闭环：

- `server/utils/memos.ts` 中的 `createMemo` 封装了对 Memos API v1 的异步调用。
- `server/services/post-publish.ts` 在文章发布流程中负责生成摘要、附加文章链接并触发 Memos 同步。
- 同步成功后会回写 `metadata.integration.memosId`，便于后续追踪和防止重复同步。

## 4. listmonk 集成 (Newsletter Distribution)

### 4.1 技术方案
- **核心内核**：使用 listmonk Admin API 创建、更新并启动远端 Campaign。
- **集成模式**：服务端代理 (Server-to-Server)。
- **受众策略**：本地营销 Campaign 继续负责文章摘要、版权尾注与分类/标签语义；真正的投递对象交由 listmonk 列表管理。

### 4.2 配置管理
在系统设置中支持：
- `LISTMONK_ENABLED`: 是否启用 listmonk 分发。
- `LISTMONK_INSTANCE_URL`: listmonk 实例地址。
- `LISTMONK_USERNAME`: listmonk 管理员用户名。
- `LISTMONK_ACCESS_TOKEN`: listmonk API Access Token。
- `LISTMONK_DEFAULT_LIST_IDS`: 默认接收列表 ID（逗号分隔）。
- `LISTMONK_CATEGORY_LIST_MAP` / `LISTMONK_TAG_LIST_MAP`: 分类/标签到 listmonk 列表的 JSON 映射。
- `LISTMONK_TEMPLATE_ID`: 可选模板 ID；留空时直接发送系统生成的营销邮件 HTML。

### 4.3 当前实现
- `server/services/listmonk.ts` 负责解析设置、渲染 Campaign HTML、创建或更新远端 Campaign，并启动 listmonk 发送。
- `server/services/notification.ts` 统一调度营销 Campaign 的邮件模式与 listmonk 模式，避免后台发送入口和文章重推入口各自维护一套状态机。
- 远端 `remoteCampaignId`、列表映射结果、失败原因与人工处理建议会回写到 Campaign 元数据，并同步进入通知投递审计日志。
- 若文章重推创建了新的本地 Campaign，会先以草稿状态落库，再通过统一发送入口异步触发，避免 `SENDING` 状态提前写入导致调度短路。

## 5. 评估与影响 (Assessment)

### 5.1 风险分析
- **Wechatsync**：依赖外部插件的稳定性。如果插件版本重大重构（如 v3 manifest），SDK 可能需要更新。
- **Memos**：API 变动风险。由于 Memos 仍在活跃迭代，需兼容 v1 版本的 API 规范（基于 Google API 设计准则）。
- **listmonk**：列表 ID 与模板 ID 由运维手工维护，配置错误会直接导致远端拒绝；因此失败日志必须保留人工处理建议，避免后台只能读到一个远端 4xx/5xx 错误。

### 5.2 扩展性
- **Webhooks**：未来可支持 Momei 接收来自 Memos 的 Webhook，实现将 Memos 内容集成到博客的“动态/说说”栏目。

## 6. 当前状态与后续计划

- [x] 已通过 `components/admin/posts/wechatsync-button.vue` 提供 Wechatsync 触发入口，并按需加载外部 SDK。
- [x] 已在 `server/utils/memos.ts` 实现 Memos API 封装，并由 `server/services/post-publish.ts` 接入发布流程。
- [x] 已通过 `components/admin/settings/third-party-settings.vue` 提供第三方集成配置项。
- [x] 已通过文章 `metadata.integration.memosId` 形成最小同步状态追踪。
- [x] 已通过 `server/services/listmonk.ts` 与 `server/services/notification.ts` 打通 Campaign -> listmonk 的外部分发链路，并补齐后台设置、投递审计和测试。
- [ ] 为 Memos / Wechatsync 补齐失败重试、幂等保护与更细粒度的状态时间线。
- [ ] 评估是否引入来自 Memos 的回流能力（Webhook / 动态流整合），避免过早扩大集成边界。
