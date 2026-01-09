# 博客公共模块 (Blog Public Module)

## 1. 概述 (Overview)

本模块包含面向公众读者的主要功能，包括文章浏览、详情阅读、归档查看等。

## 2. 页面设计 (UI Design)

### 2.1 文章详情页 (`/posts/:id` 或 `/posts/:slug`)

-   **布局**:
    -   **桌面端**: 双栏布局 (主体 70% + 目录 30%) 或 居中单栏。
    -   **移动端**: 单栏流式布局。
-   **元素**:
    -   **头部**: 面包屑, 封面图, 标题 (H1), 元信息 (作者, 时间, View).
    -   **主体**: Markdown 渲染内容, 代码块高亮, 图片 Lightbox.
    -   **底部**: 标签, 版权声明, 点赞/分享按钮, 上一篇/下一篇导航.
    -   **评论区**: 评论列表与输入框.

### 2.2 文章列表/首页 (`/posts`, `/`)

-   **布局**: 瀑布流 (Masonry) 或 列表卡片 (List Cards).
-   **卡片**: 缩略图, 标题, 摘要 (100 字), 元信息.
-   **分页**: Load More 或 数字分页.

### 2.3 归档页 (`/archives`)

-   **布局**:
    -   按年份降序分组，每年按月份聚合。
    -   支持“仅显示年份”和“展开显示当月文章”两种视图。
-   **交互**:
    -   月份默认折叠，点击展开。
    -   支持按语言过滤。

## 3. 接口设计 (API Design)

### 3.1 文章 (Posts)

-   `GET /api/posts`

    -   **Query**: `page`, `limit`, `scope=public` (默认), `tag`, `category`, `search` (关键词).
    -   **Logic**: 仅返回 `status=published` 的文章。
    -   **Response**: `{ list: Post[], total: number }`

-   `GET /api/posts/:id` (或 `/api/posts/slug/:slug`)

    -   **Response**: 文章详情 (Post Entity).

-   `POST /api/posts/:id/views`
    -   **Note**: 增加阅读量 (PV), 需做简单防刷 (IP/Session).

### 3.2 归档 (Archives)

-   `GET /api/posts/archive`
    -   **Query**: `year`, `month`, `language`, `includePosts` (boolean).
    -   **Response**: 按年/月聚合的树状结构。

### 3.3 分类与标签 (Public)

-   `GET /api/categories`: 获取分类列表。
-   `GET /api/categories/:id`: 获取分类详情。
-   `GET /api/tags`: 获取标签列表。
-   `GET /api/tags/:id`: 获取标签详情。
