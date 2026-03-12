# 创作安全与稳定性设计文档 (Creative Security & Resilience)

## 1. 概述 (Overview)

为了提高博主的创作生产力并防止内容意外丢失，本系统引入“创作安全增强”机制。该机制涵盖两个维度：
1.  **前端本地实时缓存 (LocalStorage)**：解决浏览器崩溃、误操作刷新及短期断网导致的内容丢失。
2.  **后端内容版本化 (Database Snapshots)**：解决误删、误改、逻辑回退及多人协作覆盖等中长期内容管理需求。

## 2. 本地草稿自动保存 (Local Draft Auto-save)

### 2.1 存储机制

-   **技术选型**: 使用浏览器 `LocalStorage` (针对大批量文字，若后续附件增多可考虑 `IndexedDB`)。
-   **Key 规范**: `momei-draft-{language}-{translationId}`。
    -   对于新文章，`translationId` 可能为 `new`，辅以时间戳或临时 ID。
-   **存储内容**: 包含 `title`, `content`, `summary`, `coverImage`, `categoryId`, `tags` 等核心字段的 JSON 对象。

### 2.2 工作流程 (Workflow)

1.  **自动保存 (Save)**: 
    -   编辑器内容发生变更时，触发 **防抖 (Debounce)** 处理（建议 2-3 秒）。
    -   保存时记录 `lastSavedAt` 时间戳。
2.  **加载检测 (Load/Recover)**:
    -   当用户打开编辑器时，首先查询是否存在对应的本地缓存。
    -   **逻辑判断**:
        -   若本地缓存的 `lastSavedAt` 显著晚于（如大于 30 秒）服务器返回的 `updatedAt`，弹出对话框提示：“检测到本地有未保存的草稿，是否恢复？”
        -   **操作选择**:
            -   **恢复**: 将本地缓存覆盖当前编辑器状态。
            -   **丢弃**: 清除该本地缓存（需二次确认）。
3.  **任务清除 (Clear)**:
    -   文章成功保存至服务器 (API 返回 200/201) 后，立即清除对应的 LocalStorage 条目。

## 3. 线性版本追踪与内容回滚 (Linear Version Tracking)

### 3.1 核心模型

-   **单主线提交模型**: `PostVersion` 不再代表“有限快照池”，而是文章级别的不可变线性提交链。每条版本记录都带有 `sequence` 与 `parentVersionId`，只允许沿单主线追加，不引入分支、Cherry-pick 或多头合并语义。
-   **触发时机**:
    -   文章首次创建成功后，记录 `create` 版本。
    -   编辑保存后，只要版本快照实际发生变化，就记录 `edit` 版本。
    -   从历史版本恢复时，由服务端直接写回文章并同步追加 `restore` 版本，而不是覆盖既有记录。
-   **幂等保护**: 若重复保存或重复恢复产生的目标快照与最新版本完全一致，则直接返回最新版本，不再重复插入版本记录。
-   **审计属性**: 版本记录本身即为轻量审计链路，记录操作者、提交摘要、来源类型、恢复来源、请求 IP 与 User-Agent。

### 3.2 快照范围与回滚边界

-   **进入 diff 的字段**: `title`、`summary`、`content`、`coverImage`、`categoryId`、`tagIds`、`visibility`、`copyright`、`metadata`。
-   **仅做快照展示的字段**: `language`、`translationId`、`metaVersion`。
-   **不纳入版本恢复的字段**: `slug`、`status`、`publishedAt`、`views`、`authorId`。这些字段继续由当前文章主记录控制，避免恢复历史内容时误伤 SEO 路径、发布状态或统计数据。
-   **媒体边界**: `metadata` 中的音频/TTS/第三方投递标记进入快照并参与恢复，但恢复操作不会重建已删除的二进制文件，也不会自动补做外部平台回填。
-   **翻译边界**: `translationId` 与 `language` 作为上下文快照保留，只读展示，不参与恢复写回，避免把文章拉回错误的翻译簇。

### 3.3 数据库 Schema (`PostVersion`)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | varchar | Yes | 主键 |
| `postId` | varchar | Yes | 关联文章 ID |
| `sequence` | integer | Yes | 文章内线性递增版本号 |
| `parentVersionId` | varchar | No | 上一个版本 ID，首个版本为空 |
| `restoredFromVersionId` | varchar | No | 若为恢复操作，记录恢复来源版本 ID |
| `source` | varchar | Yes | 版本来源：`create` / `edit` / `restore` / `rollback_recovery` |
| `commitSummary` | varchar | Yes | 提交摘要 |
| `changedFields` | json | Yes | 本次变化涉及的字段集合 |
| `snapshotHash` | varchar | Yes | 版本快照哈希，用于幂等保护 |
| `snapshot` | json | Yes | 结构化文章快照 |
| `title` | varchar | Yes | 标题快照冗余字段，便于快速列表展示 |
| `content` | text | Yes | 正文快照冗余字段，便于快速预览 |
| `summary` | text | No | 摘要快照冗余字段 |
| `authorId` | varchar | Yes | 执行本次操作的操作者 ID |
| `ipAddress` | varchar | No | 请求 IP |
| `userAgent` | varchar | No | 请求 User-Agent |
| `createdAt` | datetime | Yes | 版本创建时间 |

### 3.4 交互设计

1.  **历史面板**: 编辑器右侧历史面板展示线性版本列表，至少包含版本号、提交摘要、操作者、时间、来源类型。
2.  **差异对比**:
    -   默认支持与相邻父版本对比。
    -   支持切换为“当前文章状态”或指定历史版本进行比较。
    -   文字与结构化字段 diff 统一由服务端计算，前端只负责渲染，保证展示口径一致。
3.  **恢复机制**:
    -   点击“恢复此版本”后直接调用服务端恢复接口。
    -   恢复成功后，当前文章内容立刻变为目标版本快照，并自动追加新的 `restore` 版本。
    -   若最新版本已与目标版本一致，则返回幂等成功提示，不重复生成新版本。

## 4. 全量文章导出 (Article Export)

### 4.1 核心逻辑
为博主提供将文章内容导出为本地 Markdown 文件的能力，支持单篇下载及批量打包。导出格式深度兼容 **Hexo** 规范（包含 YAML Front-matter），便于内容迁移。

### 4.2 导出规格
- **单篇导出**: 导出当前文章。
- **关联翻译导出**: 导出某篇文章及其所有语言版本。
- **批量导出**: 在管理页多选选定内容后进行 ZIP 压缩导出。

---
> 关联代码: `composables/use-post-editor-auto-save.ts` | `composables/use-post-export.ts`

## 5. 接口设计 (API Design)

### 4.1 管理端版本接口

-   `GET /api/admin/posts/:id/versions`
    -   **说明**: 获取指定文章的线性版本历史列表。
-   `GET /api/admin/posts/:id/versions/:versionId`
    -   **说明**: 获取特定版本的详细快照。
-   `GET /api/admin/posts/:id/versions/:versionId/diff`
    -   **说明**: 获取版本差异；支持与父版本、当前文章状态或指定版本比较。
-   `POST /api/admin/posts/:id/versions/:versionId/restore`
    -   **说明**: 将目标版本恢复为当前文章状态，并生成新的线性恢复版本。

## 6. 安全与限制 (Security & Limitations)

-   **权限要求**: 仅文章作者本人或管理员可查看历史、对比差异和执行恢复；普通作者不能查看他人的版本历史。
-   **不可变历史**: 版本记录默认不可手工删除，避免破坏线性审计链。
-   **敏感信息**: 已删除文章的版本快照按主文章级联删除；版本快照中不额外存储密码字段与其他敏感凭据。
-   **离线提示**: 自动保存失败（如 Storage 已满）时，应在 UI 给予静默通知，避免阻塞用户输入。

## 7. 后续扩展 (Future Extensions)

-   支持“手动打标”版本，使其不受自动滚动清理影响。
-   支持导出版本快照为 Markdown 文件。
