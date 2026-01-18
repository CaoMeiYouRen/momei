# 主题与定制化系统 (Theme & Customization System)

## 1. 概述 (Overview)

本模块旨在为管理员提供高度灵活的博客外观定制能力。系统应支持基础色调调整、布局微调、自定义 CSS 注入、多种专业预设以及特殊节日/氛围模式。

## 2. 设计目标 (Design Goals)

-   **感官一致性**: 确保在切换预设时，文字的可读性和对比度符合 WCAG 标准。
-   **易用性**: 提供可视化界面进行配色和基础样式调整。
-   **灵活性**: 支持“自定义”预设，允许直接手动微调颜色并注入 CSS 代码。
-   **零闪烁 (Flicker-free)**: 通过动态注入 CSS 变量，确保主题背景和主色调在页面加载时无闪烁。

## 3. 主题预设 (Theme Presets)

系统提供几套经过专业设计的官方主题，每个预设包含针对 **浅色 (Light)** 和 **深色 (Dark)** 模式的优化。

### 3.1 极致经典 (Classic Momei)
默认主题，基于“墨”与“宣纸”的设计理念。
-   **设计核心**: 水墨质感，极简灰蓝。
-   **主色调**: Slate系 (`#64748b`).

### 3.2 清新自然绿 (Natural Green)
受大自然启发的绿色调，给人以清新、舒适的视觉感受。
-   **设计核心**: 生机绿，高易读性。

### 3.3 琥珀暖色 (Warm Amber)
专为深度阅读设计，低蓝光感，营造温馨氛围。
-   **设计核心**: 琥珀色，柔和边缘。

### 3.4 极客紫 (Geek Purple)
充满科技感与未来感的配色，强调高对比度。
-   **设计核心**: 极客紫，深邃背景 (OLED Black 友好)。
-   **主色调**: Purple/Violet (`#a855f7`).

### 3.5 自定义个性化 (Custom)
允许用户完全接管色彩控制，系统不再应用预设的覆盖逻辑，适合高级定制。

## 4. 核心功能 (Core Features)

### 3.2 基础外观定制 (Visual Customization)
-   **主色调 (Primary Color)**: 允许微调并实时生成完整的全色阶 UI。
-   **圆角配置 (Border Radius)**: 全局调整组件圆角。

### 3.3 品牌识别定制 (Branding)
-   **Logo & Favicon**: 支持自定义 URL 替换。
-   **背景设置**: 支持纯色背景或上传自定义背景图片（含 Fixed 固定模式）。

## 5. 技术实现 (Technical Implementation)

### 5.1 数据库方案 (Database)

使用 `Setting` 系统（键值对）存储：
- `theme_preset`: 预设标识符 (`default`, `green`, `amber`, `geek`, `custom`)
- `theme_primary_color`: 自定义主色 HEX
- `theme_accent_color`: 自定义点缀色 HEX
- `theme_border_radius`: 字符串（如 `8px` 或 `0.5rem`）

### 5.2 前端样式应用 (Style Application)

1.  **动态变量注入**: 在 `useTheme` Composable 中计算样式字符串。
2.  **颜色生成**: 利用 CSS `color-mix(in srgb, var(--primary), white/black X%)` 动态生成 PrimeVue 需要的 50-900 色阶。
3.  **对比度自适应**: 根据主色亮度自动切换 `primary-contrast-color`（黑或白）。

## 6. 后续计划 (Future Scope)

-   **主题商店**: 支持导入/导出主题配置包。
-   **字体定制**: 允许为不同主题关联特定字体（如极客主题关联 Monospace）。
-   **多模板切换**: 支持整套布局结构的变更。
