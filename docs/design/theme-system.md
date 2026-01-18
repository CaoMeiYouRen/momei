# 墨梅主题系统设计规范 (Theme System Design)

## 1. 概述 (Overview)

墨梅主题系统旨在提供多套经过专业设计的配色方案，确保用户在切换预设时不仅改变了颜色，还能获得统一且和谐的视觉体验。每个预设都包含针对 **浅色模式 (Light)** 和 **深色模式 (Dark)** 的专门优化。

## 2. 核心设计原则 (Design Principles)

- **一致性**: 无论何种主题，文字的可读性和对比度必须符合 WCAG 标准。
- **层次感**: 通过表面色 (Surface Colors) 的阶梯变化体现组件的深度。
- **情感化**: 每个项目对应一种特定的使用心境 (如：专业写作、极客思维、沉浸阅读)。

## 3. 预设详情 (Presets)

### 3.1 极致经典 (Classic Momei)
作为墨梅的默认主题，基于“墨”与“宣纸”的设计理念。

- **设计核心**: 水墨质感，极简白。
- **主色调**: Slate 800 - 900 (`#1e293b`).
- **模式定义**:

| 变量 | 浅色模式 (Light) | 深色模式 (Dark) |
| :--- | :--- | :--- |
| **Primary (500)** | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) |
| **Accent (梅红)** | `#f43f5e` (Rose 500) | `#fb7185` (Rose 400) |
| **Surface (Base)** | `#ffffff` (White) | `#020617` (Slate 950) |
| **Text (Main)** | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) |
| **Text (Muted)** | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) |

---

### 3.2 深邃极客 (Deep Geek)
专为开发者和极客设计，灵感来自现代代码编辑器和终端。

- **设计核心**: 终端绿，高对比度。
- **主色调**: Emerald 500 - 600 (`#10b981`).
- **模式定义**:

| 变量 | 浅色模式 (Light) | 深色模式 (Dark) |
| :--- | :--- | :--- |
| **Primary (500)** | `#059669` (Emerald 600) | `#10b981` (Emerald 500) |
| **Surface (Base)** | `#f0fdf4` (Emerald 50) | `#052e16` (Emerald 950) |
| **Text (Main)** | `#064e3b` (Emerald 900) | `#ecfdf5` (Emerald 50) |
| **Text (Muted)** | `#059669` (Emerald 600) | `#34d399` (Emerald 400) |

---

### 3.3 柔和暖色 (Soft Warm)
专为深度阅读和生活分享设计，灵感来自夕阳和牛皮纸。

- **设计核心**: 琥珀色，低蓝光感。
- **主色调**: Amber 500 - 600 (`#d97706`).
- **模式定义**:

| 变量 | 浅色模式 (Light) | 深色模式 (Dark) |
| :--- | :--- | :--- |
| **Primary (500)** | `#d97706` (Amber 600) | `#f59e0b` (Amber 500) |
| **Surface (Base)** | `#fffbeb` (Amber 50) | `#451a03` (Amber 950) |
| **Text (Main)** | `#451a03` (Amber 900) | `#fef3c7` (Amber 50) |
| **Text (Muted)** | `#b45309` (Amber 700) | `#fbbf24` (Amber 400) |

## 4. 动态应用机制 (Implementation Strategy)

### 4.1 变量映射
系统通过修改根元素的 CSS 变量来实现主题切换：

```scss
:root {
  // 基础语义变量
  --p-primary-500: [Preset.Primary];
  --p-primary-contrast: #ffffff;
  
  // 表面色重定义 (用于整体氛围)
  --p-surface-0: [Preset.Surface];
  
  // 文字颜色
  --p-text-color: [Preset.TextMain];
}
```

### 4.2 预览系统
在后台管理界面，应使用局部 CSS 作用域对 `PreviewContainer` 进行样式注入，模拟全站效果而不破坏管理端自身的 UI。

## 5. 后续规划 (Backlog)

- **字体预设**: 经典主题配合衬线体 (Noto Serif)，极客主题配合等宽体 (Fira Code)。
- **微动效定制**: 极客主题使用更硬朗的阶梯式过渡，暖色主题使用更柔和的弹性过渡。
