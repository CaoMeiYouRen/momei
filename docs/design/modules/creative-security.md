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

## 3. 有限版本化管理 (Limited Content Versioning)

### 3.1 核心逻辑

-   **快照触发**: 每次通过 API 执行保存/更新操作且内容（Title/Content）发生实际变化时，自动创建版本快照。
-   **保留策略**: 每个 `translationId`（或主语言 ID）最多保留 **3-5** 个修改版本。
-   **滚动清理**: 当新版本产生且超出上限时，自动删除该文章下最旧的一个版本。

### 3.2 数据库 Schema (`PostVersion`)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | varchar | Yes | 主键 |
| `postId` | varchar | Yes | 关联的文章原始 ID |
| `title` | varchar | Yes | 标题快照 |
| `content` | text | Yes | 正文快照 |
| `summary` | text | No | 摘要快照 |
| `authorId` | varchar | Yes | 执行此次修改的作者 ID |

## 4. 全量文章导出 (Article Export)

### 4.1 核心逻辑
为博主提供将文章内容导出为本地 Markdown 文件的能力，支持单篇下载及批量打包。导出格式深度兼容 **Hexo** 规范（包含 YAML Front-matter），便于内容迁移。

### 4.2 导出规格
- **单篇导出**: 导出当前文章。
- **关联翻译导出**: 导出某篇文章及其所有语言版本。
- **批量导出**: 在管理页多选选定内容后进行 ZIP 压缩导出。

---
> 关联代码: `composables/use-post-editor-auto-save.ts` | `composables/use-post-export.ts`
| `reason` | varchar | No | 修改原因/备注 (可选) |
| `createdAt` | datetime | Yes | 版本生成时间 |

### 3.3 交互设计

1.  **历史面板**: 编辑器侧边栏增加“历史版本”入口。
2.  **版本对比**:
    -   支持查看历史版本列表。
    -   选中某一版本时，展示其内容与当前正文的 **文字差异 (Diff)**。
3.  **回滚机制**:
    -   点击“回滚”按钮，将选定版本的内容加载到编辑器。
    -   **注意**: 回滚操作本身不立即提交数据库，需用户手动点击“保存”以生成新的正文及版本追踪。

## 4. 接口设计 (API Design)

### 4.1 管理端版本接口

-   `GET /api/admin/posts/:id/versions`
    -   **说明**: 获取指定文章的所有历史版本列表。
-   `GET /api/admin/posts/:id/versions/:versionId`
    -   **说明**: 获取特定版本的详细内容。
-   `DELETE /api/admin/posts/:id/versions/:versionId`
    -   **说明**: 手动删除某个不想要的版本。

## 5. 安全与限制 (Security & Limitations)

-   **配额管理**: 为防止数据库膨胀，强制执行 5 个版本的硬上限。
-   **敏感信息**: 已删除的文章其版本快照应同步执行级联删除或标记清除。
-   **离线提示**: 自动保存失败（如 Storage 已满）时，应在 UI 给予静默通知，避免阻塞用户输入。

## 6. 后续扩展 (Future Extensions)

-   支持“手动打标”版本，使其不受自动滚动清理影响。
-   支持导出版本快照为 Markdown 文件。
