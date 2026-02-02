# 主题系统 (Theme System)

## 1. 概述 (Overview)

墨梅博客提供高度灵活的外观定制能力，允许管理员通过后台直接调整博客的视觉风格。系统支持预设主题切换、主色调微调、圆角配置以及自定义 CSS 注入。

## 2. 核心功能 (Core Features)

### 2.1 主题预设 (Theme Presets)
内置多套专业设计的官方主题：
- **极致经典 (Classic Momei)**: 默认水墨质感，极简灰蓝。
- **清新自然绿 (Natural Green)**: 生机勃勃的绿色视觉。
- **琥珀暖色 (Warm Amber)**: 柔和的阅读体验。
- **极客紫 (Geek Purple)**: 高对比度的科技感配色。
- **自定义 (Custom)**: 完全接管色彩控制。

### 2.2 基础定制 (Visual Customization)
- **色阶生成**: 仅需设置主色，系统自动生成 PrimeVue 50-900 五阶 UI 颜色。
- **圆角调整**: 全局控制组件边界半径。
- **品牌识别**: 支持上传自定义 Logo、Favicon 和背景图。

### 2.3 主题画廊 (Theme Gallery)
管理员可以保存当前的自定义配置作为“画廊方案”，方便随时切换、导出或预览：
- **无损切换**: 切换方案不影响现有的配置数据。
- **临时预览**: 支持在应用前，仅对当前管理会话进行视觉预览，不影响访客。
- **自动快照**: 保存时自动生成配置的缩略图。

## 3. 技术实现 (Technical Architecture)

### 3.1 样式驱动
系统利用 CSS 变量 (`--primary-50` 到 `--primary-900`) 驱动全站样式。在 `useTheme` Composable 中动态计算并注入样式字符串。

### 3.2 零闪烁 (Flicker-free)
通过预渲染（SSR）与前端早期的 CSS 注入机制，确保主题在页面加载过程中无视觉闪烁（Flash of Unstyled Content）。

### 3.3 数据存储
- 主题参数持久化于 `Setting` 表中（`theme_` 前缀字段）。
- 画廊方案存储于独立的 `ThemeConfig` 实体中。

## 4. 开发建议 (Development)

### 4.1 适配新主题
在开发新组件时，请优先使用 CSS 变量（如 `var(--primary-color)`）而非硬编码色值。

### 4.2 扩展预设
如需添加新的官方预设，可参考 `useTheme` 中的预设映射表进行扩展。

---

> 相关代码地址: [composables/use-theme.ts](https://github.com/CaoMeiYouRen/momei/blob/master/composables/use-theme.ts)
