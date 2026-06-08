# 性能优化历史记录

本文档用于记录已实施的性能优化条目与验证口径。规范阈值、门禁策略与预算标准请以 [性能规范](../standards/performance.md) 为准。

## Phase 44 (2026-06-07) — 首屏 Logo 预加载 + CSS @import 扁平化

### 优化项 1: 预加载 Logo 图片

- **改动**: `app.vue` useHead 新增 `<link rel="preload" href="/logo.png" as="image">`
- **影响指标**: LCP（Logo 是多数页面首屏关键元素，提前发现并下载）
- **预期收益**: 减少 Logo 资源发现时间约 100-300ms（视网络条件）
- **验证方式**: Chrome DevTools → Network → 确认 `/logo.png` 预加载请求出现在早期

### 优化项 2: 扁平化 CSS 加载链路

- **改动**: `styles/vendor.css` 中嵌套 `@import` → `nuxt.config.ts` 的 `css` 数组中直接声明各 CSS 文件（normalize.css, @mdi/font, primeicons）
- **影响指标**: LCP / FCP（消除 CSS `@import` 的串行下载瓶颈，浏览器可并行加载）
- **预期收益**: 减少 CSS 加载链深度，降低 FCP 约 50-150ms
- **验证方式**: Chrome DevTools → Coverage → 确认三个 CSS 文件的下载不再串行等待
