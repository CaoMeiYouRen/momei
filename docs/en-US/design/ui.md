---
source_branch: master
last_sync: 2026-02-11
---

# UI Design

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../design/ui.md) shall prevail.
:::

## 1. Design Philosophy

The design of **"Momei"** is inspired by the traditional Chinese concepts of "Ink" (Mo) and "Plum" (Mei). combined with modern web trends, it aims to create a **Minimalist**, **Elegant**, and **Efficient** cross-language blogging platform.

-   **Simplicity**: Remove redundant decorations and focus on the content itself. Whitespace is a core design element.
-   **Modernity**: Use subtle animations and fluid interactions to convey a sense of technology, avoiding abrupt transitions.
-   **Immersion**: Provide a distraction-free reading and writing experience.
-   **Privacy & Frictionless**: Require login only for essential interactions like comments and subscriptions. Prioritize anonymous access to minimize user disturbance and protect privacy.

## 2. Visual Style

### 2.1 Theme

Customized based on the **PrimeVue Aura** theme. Aura is modern, rounded, and transparent, aligning perfectly with Momei's identity.

-   **Basic Style**: Flat + Subtle Shadows.
-   **Border Radius**: Medium curvature (0.5rem - 1rem) for a friendly feel.
-   **Texture**: Glassmorphism effects can be used for navigation bars or modals to add depth and layers.

### 2.2 Color Palette

Inspired by ink-wash painting and plum blossoms. Momei supports highly customizable color schemes, allowing admins to configure core colors for both light and dark modes:

-   **Primary**:
    -   Used for main buttons, highlighted text, and the logo.
    -   Default: Slate 800 (`#1e293b`) to Slate 900 (`#0f172a`).
-   **Accent**:
    -   Used for emphasis and vibrant interactive elements.
    -   Default: Rose 500 (`#f43f5e`).
-   **Surface**:
    -   Used for cards and component backgrounds.
    -   Light default: `#ffffff`; Dark default: `#121212`.
-   **Text**:
    -   Main typography color.
    -   Light default: Slate 900; Dark default: Slate 100.

The system supports multiple presets (e.g., Amber, Geek Purple, Fresh Green) and a fully custom mode, allowing fine-grained adjustment of 8 core color points (4 per mode).

### 2.3 Typography

-   **Chinese Fonts**: Prioritize system defaults like `PingFang SC`, `Microsoft YaHei`. Open-source serif fonts (e.g., `Noto Serif SC`) can be used for article bodies to create a literary feel.
-   **English Fonts**: `Inter` or `Roboto` for a modern look.
-   **Monospace**: `Fira Code` or `JetBrains Mono`.

### 2.4 Dark Mode & Theme Overrides

-   **Strategy**: Supports **Light**, **Dark**, and **System** (follow OS) modes.
-   **Implementation**:
    -   Toggle via a `class="dark"` on the HTML root using CSS variables.
    -   **CSS Layers (@layer)**: Defined hierarchy to elegantly override PrimeVue:
        1. `primevue`: Base component styles.
        2. `momei-base`: Global base styles.
        3. `momei-overrides`: Top-priority layer for dynamic theme variable injection.
-   **Experience**:
    -   Smooth transitions when switching.
    -   Prevention of FOUC (Flash of Unstyled Content).

## 3. Component Library & Standards

Uses **PrimeVue** as the base library, complemented by **SCSS** for layout and fine-tuning.

### 3.1 Layout

-   **Responsive**: Mobile First.
-   **Max Width**: Content area limited to `max-w-4xl` (~900px) to optimize reading experience.
-   **Grid**: Flexbox or Grid-based layout.

### 3.2 Admin Components

Efficient custom components for the dashboard:

-   **AdminPageHeader**: Unified header with title, breadcrumbs, and primary actions.
-   **ConfirmDeleteDialog**: Standardized deletion confirmation based on PrimeVue's ConfirmDialog.
-   **UnifiedTranslationEditor**: (Planned) A unified editor allowing admins to switch between language tabs for a post, reducing cognitive load when managing translation clusters.
