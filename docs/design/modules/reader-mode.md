# 沉浸式阅读模式 (Immersive Reader Mode)

本文档描述了 Momei 博客沉浸式阅读模式的设计与实现规范。

## 1. 设计初衷

为了给用户提供纯净、专注的阅读环境，沉浸式阅读模式将隐藏所有非核心 UI 元素（如导航栏、侧边栏、页脚、评论区等），并允许用户根据个人喜好调整排版与配色。

## 2. 核心特性

- **视觉精简**：隐藏 header, footer, sidebar, post-detail 装饰元素。
- **自定义排版**：
    - **字号**：支持从 14px 到 26px 的动态调节。
    - **行高**：支持从 1.5 到 2.2 的无级调节。
    - **页宽**：正文区域宽度支持 600px 到 1000px 调节。
- **预设主题 (Preset Themes)**：
    - `default`: 遵循系统当前主题（明亮/暗黑）。
    - `sepia` (羊皮纸): 背景色 `#f4ecd8`，文字色 `#5b4636`。
    - `eye-care` (护眼): 背景色 `#c7edcc`，文字色 `#2c3e50`。
    - `dark-night` (深夜): 背景色 `#1a1a1b`，文字色 `#d7dadc`。
- **交互细节**：
    - 支持 `Esc` 键快速退出。
    - 调节面板支持实时预览。
    - 偏好设置通过 `localStorage` 自动持久化。

## 3. 技术方案

### 3.1 状态管理 (`useReaderMode`)

使用 Vue Composable 管理阅读器状态：

```typescript
interface ReaderSettings {
    active: boolean;
    fontSize: number;    // px
    lineHeight: number;  // unitless
    width: number;       // px
    theme: 'default' | 'sepia' | 'eye-care' | 'dark-night';
}
```

### 3.2 样式控制

通过在 `<html>` 或 `<body>` 上切换 `.reader-mode-active` 类名，配合 CSS 变量实现：

```scss
:root {
    --reader-font-size: 18px;
    --reader-line-height: 1.8;
    --reader-width: 800px;
    --reader-bg: var(--p-content-background);
    --reader-text: var(--p-content-text-color);
}

.reader-mode-active {
    .app-header, .app-footer, .post-detail__sidebar, .post-detail__cover {
        display: none !important;
    }
    .post-detail__main {
        max-width: var(--reader-width);
        margin: 0 auto;
        font-size: var(--reader-font-size);
        line-height: var(--reader-line-height);
        background: var(--reader-bg);
        color: var(--reader-text);
    }
}
```

### 3.3 国际化 (i18n)

需在 `i18n/` 中增加对应的词条：
- `reader.mode_enter`: 进入阅读模式
- `reader.mode_exit`: 退出阅读模式
- `reader.settings_title`: 阅读器设置
- `reader.font_size`: 字号
- `reader.line_height`: 行高
- `reader.page_width`: 页面宽度
- `reader.theme_sepia`: 羊皮纸
- `reader.theme_eyecare`: 护眼
- `reader.theme_dark`: 深夜

## 4. 任务拆解

- [ ] 创建 `composables/use-reader-mode.ts`。
- [ ] 在 `article-content.vue` 或 `pages/posts/[id].vue` 中集成控制面板插件。
- [ ] 编写全局 SCSS 变量与覆盖样式。
- [ ] 增加 i18n 多语言支持。
- [ ] 实现针对 `Esc` 键的监听逻辑。
