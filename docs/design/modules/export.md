# 文章导出功能设计文档 (Article Export Design)

## 1. 概述
为用户提供将文章内容导出为本地文件的能力，支持单篇 Markdown 下载及批量 ZIP 打包。导出格式深度兼容 Hexo 规范，确保数据的可迁移性。

## 2. 核心逻辑

### 2.1 格式转换 (Hexo Compatibility)
映射规则如下：

| Momei 字段 | Hexo Front-matter | 说明 |
| :--- | :--- | :--- |
| `title` | `title` | 保持不变 |
| `createdAt` | `date` | ISO 格式字符串 |
| `category.name` | `categories` | 导出为单元素数组 (Hexo 风格) |
| `tags[].name` | `tags` | 导出为数组 |
| `slug` | `abbrlink` | 自定义 URL 路径 |
| `content` | (Body) | Markdown 正文 |
| `summary` | `description` | 文章摘要 |
| `coverImage` | `image` | 文章封面图片 URL |
| `audioUrl` | `audio` | 播客音频 URL (如存在) |
| `author.name` | `author` | 作者名称 |

**丢弃字段**：AI 建议、阅读统计、SEO 特定属性等非标准字段将不予导出，以维持极简兼容性。

### 2.2 媒体资源处理
- **外链保持**：所有图片资源默认视为已持久化于 CDN 或线上存储，导出时不进行本地化转换，直接保留原始 Markdown 中的 URL。

## 3. API 设计

### 3.1 单篇导出
- **路径**: `GET /api/admin/posts/[id]/export`
- **参数**: `id` - 文章 ID
- **响应**: `text/markdown` 类型的流文件下载。
- **权限**: 管理员 或 文章作者。

### 3.2 批量导出
- **路径**: `POST /api/admin/posts/export`
- **Payload**: `{ ids: string[] }`
- **响应**: `application/zip` 类型的流文件下载。
- **文件名格式**: `momei-export-202X-XX-XX.zip`
- **权限**: 
    - 管理员：可导出任意选中的 ID。
    - 作者：仅能导出属于自己的 ID（后端需进行二次校验，过滤无权访问的 ID）。

## 4. UI 交互设计

### 4.1 管理列表页 (`pages/admin/posts/index.vue`)
- **批量操作栏**：在 DataTable 勾选后，顶部操作栏显示“导出选定”按钮。
- **单个操作列**：在文章行的操作菜单（...）中增加“导出为 Markdown”。

### 4.2 编辑详情页 (`pages/admin/posts/[id].vue`)
- **设置面板**：在侧边栏增加“下载/备份”选项。

## 5. 验收标准
1. [ ] 点击导出按钮后，浏览器正常触发文件下载。
2. [ ] 导出的 Markdown 文件可直接被 Hexo 或任意 Markdown 编辑器正确解析 Front-matter。
3. [ ] 批量导出的 ZIP 包内部不包含多余层级。
4. [ ] 权限校验生效，普通作者尝试导出他人文章时返回 403。
