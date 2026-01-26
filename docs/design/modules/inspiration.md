# 灵感捕捉引擎设计规范 (Inspiration Engine Design)

## 1. 概述 (Overview)

灵感捕捉引擎旨在解决博主在日常生活中碎片化想法转瞬即逝的问题。它通过提供多端、低门槛的采集入口（Snippets），将碎片内容汇聚到“灵感收纳箱”，并利用 AI 能力辅助将其转化为正式的文章。

## 2. 核心流程：捕捉法则 (Capture Methodology)

为了实现“零阻力”捕捉，系统需支持以下层次的采集方式：

### 2.1 采集入口 (Ingestion Points)

1.  **管理后台快速采集 (Dashboard/Admin Context)**:
    -   在管理后台顶部导航栏或仪表盘显示“快速灵感”浮窗。
    -   支持纯文本、拖拽图片、粘贴链接。
2.  **PWA 全平台移动应用 (Universal Mobile App)**:
    -   利用 Nuxt 的 PWA 能力，支持“添加到主屏幕”。
    -   提供一个**“直达输入框”**的极简模式 (Minimalist Capture Mode)，消除浏览器地址栏干扰，实现类似原生 App 的秒开即输体验。这是最通用的移动端方案。
3.  **开放式 API / Webhook (多端自动化)**:
    -   **通用 API 端点**: 提供基于 `Auth-Token` 的简单 REST API，不绑定平台。
    -   **聊天机器人集成 (Messaging Bots)**: 官方支持或提供教程集成 Telegram Bot / Discord Bot。发送一条消息给机器人，即刻存入博客。
    -   **iOS 快捷指令 (可选)**: 作为 API 的应用案例之一。
4.  **浏览器书签脚本 (Bookmarklet)**:
    -   提供一段简单的 JavaScript 代码，用户存为书签。点击书签即可弹出一个小窗抓取当前页面标题、URL 和选中的文字。
5.  **开发者 CLI 模式 (For Geeks)**:
    -   支持简单的 cURL 命令或特定的 CLI 工具采集灵感。

### 2.2 存储实体 (Snippet Entity)

灵感碎片 (Snippet) 应作为独立于文章 (Post) 的轻量级实体存在。

-   **字段设计**:
    -   `id`: 雪花 ID。
    -   `content`: 灵感正文 (支持 Markdown)。
    -   `images`: 存储为 JSON 数组的图片 URL 列表。
    -   `audio`: 音频 URL 及转写状态 (用于 OS 录音采集)。
    -   `source`: 来源标识 (如 `web`, `api`, `extension`, `ios-shortcut`)。
    -   `metadata`: 存储关联上下文 (如 `sourceUrl`, `deviceInfo`, `geo` 等)。
    -   `status`: 状态 (`inbox`, `archived`, `converted`)。
    -   `postId`: 如果已转为文章，记录关联的文章 ID。

## 3. 增强法则：AI 赋能 (AI Enhancement)

采集后的灵感并非静止，系统应提供以下自动化增强：

1.  **音频转写**: 如果采集来源是音频片段，自动调用 AI 转为文字存入内容。
2.  **自动打标 (Auto Tagging)**: AI 分析灵感内容，尝试在现有标签库中匹配或建议新标签。
3.  **内容清洗**: 自动格式化粘贴的杂乱网页内容。

## 4. 转化法则：从碎片到创作 (Conversion Methodology)

这是灵感引擎价值的核心体现。

1.  **单一转化**: 一键将 Snippet 转为文章草稿，自动填充 `content`。
2.  **聚合转化 (Combine & Write)**:
    -   在灵感库中勾选多个相关的 Snippet。
    -   点击“生成文章大纲”。
    -   AI 根据选中的多个片段，梳理逻辑关系，生成一份结构化的文章大纲（Scaffold）。
3.  **历史追溯**: 转为文章后，在文章编辑页侧边栏显示“灵感来源”，保留创作路径。

## 5. 接口设计 (API Design)

### 5.1 灵感接口 (`/api/snippets/*`)

-   `GET /api/snippets`: 列表展示，支持按状态过滤。
-   `POST /api/snippets`: 创建灵感 (支持 API Key 鉴权以便外部调用)。
-   `PUT /api/snippets/:id`: 修改或归档。
-   `POST /api/snippets/:id/convert`: 执行转化。
-   `POST /api/snippets/aggregate`: 多个灵感聚合分析。

## 6. UI 设计要点 (UI Design)

-   **极简主义**: 采集框应只需一次点击即可聚焦输入。
-   **时间线视图**: 类似 Memos/Flomo 的瀑布流或日历热力图，展示灵感产出频率。
-   **拖拽支持**: 支持将灵感碎片直接拖入文章编辑器侧边栏。
