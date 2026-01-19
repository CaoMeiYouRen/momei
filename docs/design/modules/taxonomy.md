# 分类与标签聚合页设计 (Taxonomy Aggregation)

## 1. 概述

为了增强文章的可发现性和相关性，本模块旨在实现分类 (Category) 和标签 (Tag) 的详情展示页。用户点击文章详情或卡片中的分类/标签时，将跳转到对应的聚合路径，展示所有关联的文章。

## 2. 路由结构

采用基于 `slug` 的动态路由，确保 URL 具有良好的 SEO。

-   **分类页**: `/categories/[slug]`
    -   示例: `/categories/javascript`
-   **标签页**: `/tags/[slug]`
    -   示例: `/tags/nuxt`

## 3. 页面逻辑

### 3.1 数据获取

-   **页面初始化**:
    -   基于 `useRoute().params.slug` 识别目标分类或标签。
    -   调用后端 API 获取该分类/标签的元数据（名称、描述等）。
    -   调用文章列表 API 进行过滤查询。
-   **文章筛选 API**:
    -   请求路径: `GET /api/posts`
    -   查询参数:
        -   `category`: 分类 slug
        -   `tag`: 标签 slug (单数，用于聚合页)
        -   `language`: 当前语言 (i18n 隔离)

### 3.2 UI 展示

-   **头部 (Header)**:
    -   显示当前分类/标签的名称。
    -   显示该分类下的文章总数。
    -   (可选) 显示分类的描述信息。
-   **列表内容**:
    -   复用 `article-card` 组件。
    -   支持分页加载。
-   **空状态**:
    -   若无相关文章，展示友好提示。

## 4. 交互增强

-   **详情页**: 在 `pages/posts/[id].vue` 中，将面包屑中的分类名称、底部的标签 Chip 转换为 `nuxt-link`。
-   **列表页**: 在 `components/article-card.vue` 中，将分类和标签设为可点击状态。

## 5. SEO 优化

-   动态设置页面 Title: `[分类/标签名] - [站点名称]`。
-   Meta Description 使用分类描述或占位符。
-   遵循多语言前缀路由 (`/zh/categories/...`)。
