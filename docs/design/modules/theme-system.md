# 主题与定制化系统 (Theme & Customization System)

## 1. 概述 (Overview)

本模块旨在为管理员提供高度灵活的博客外观定制能力。系统应支持基础色调调整、布局微调、自定义 CSS 注入以及特殊节日/氛围模式。

## 2. 设计目标 (Design Goals)

-   **易用性**: 提供可视化界面进行配色和基础样式调整。
-   **灵活性**: 支持直接注入 CSS 代码以满足高级用户的个性化需求。
-   **零闪烁 (Flicker-free)**: 尽量在服务端渲染或早期的脚本阶段应用主题，避免页面加载时的样式跳变。
-   **动态切换**: 支持在后台实时预览主题变更效果。

## 3. 核心功能 (Core Features)

### 3.1 主题预设 (Theme Presets)
-   **官方预设**: 提供几套经过精心设计的官方主题（如：极致经典、深邃极客、柔和暖色）。
-   **一键切换**: 管理员可以在后台预览并应用不同的主题预设，每套预设包含特定的配色、间距和阴影风格。

### 3.2 基础外观定制 (Visual Presets)
-   **主色调 (Primary Color)**: 基于选定的预设，允许微调主色调。系统应根据主色调自动生成完整的 UI 色阶。
-   **圆角配置 (Border Radius)**: 全局调整组件（按钮、卡片、输入框）的圆角弧度。
-   **全局置灰 (Mourning Mode)**: 特殊日期的全站黑白模式。

### 3.3 品牌识别定制 (Branding)
-   **Logo 定制**: 支持上传站点 Logo（替代文本标题）。
-   **Favicon 定制**: 支持上传网站图标。
-   **背景设置**: 允许选择纯色背景或上传自定义背景图片。

## 4. 技术实现 (Technical Implementation)

### 4.1 数据库方案 (Database)

新增 `Setting` 实体（通用配置表），采用键值对存储：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `key` | `string` | 唯一键名 (如 `theme_primary_color`) |
| `value` | `text` | 配置内容 (JSON 或 字符串) |

**初始主题配置键 (Keys):**
- `theme_primary_color`: HEX (e.g., `#64748b`)
- `theme_border_radius`: `string` (e.g., `0.5rem`)
- `theme_custom_css`: `text`
- `theme_custom_js`: `text`
- `theme_mourning_mode`: `boolean`
- `theme_background_config`: `json`

### 4.2 前端样式应用 (Style Application)

1.  **CSS 变量**: 所有的自定义配色将映射为全局 CSS 变量 (如 `--p-primary-500`)。
2.  **Style Tag 注入**: 使用 Nuxt 的 `useHead` 动态注入 `<style id="momei-theme-custom">`。
3.  **PrimeVue Theme 更新**:
    -   利用 PrimeVue 的 `usePrimeVue().config.theme.preset` 或手动覆盖 CSS 变量。
    -   PrimeVue 4.x 支持基于 CSS 变量的主题切换，应优先利用此特性。

### 4.3 管理后台界面 (Admin UI)

在“系统设置”下新增“主题定制”子页面：
-   **配色方案**: 色盘选择器。
-   **代码注入**: 使用代码编辑器（如简单 Textarea 或 Monaco Editor 基础版）。
-   **开关项**: 切换哀悼模式等。

## 5. 安全性考虑 (Security)

-   **XSS 防护**: 自定义 JS 注入仅限管理员权限，且在渲染时需明确提示潜在风险。
-   **内容安全策略 (CSP)**: 确保注入的样式和脚本不会违反站点的 CSP 策略。

## 6. 后续计划 (Future Scope)

-   **主题商店/市场**: 支持导入/导出 JSON 格式的主题配置包。
-   **看板娘 (Live2D)**: 引入预设的看板娘组件并支持模型 URL 配置。
-   **多模板切换**: 支持整套布局模板的切换。
