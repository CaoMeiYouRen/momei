# 性能优化历史记录

本文档用于记录已实施的性能优化条目与验证口径。规范阈值、门禁策略与预算标准请以 [性能规范](../standards/performance.md) 为准。

## Phase 52 前置分析 (2026-06-23) — Vercel 缓存穿透与 Bot 流量根因分析

### 发现

跨 Vercel 函数日志（1h 采样，83 条记录）与 Neon 操作日志（24h，~40 次启停）联合分析：

- Vercel Cache **100% MISS**（83/83），无 ISR/CDN/SSG 缓存
- Bot/爬虫流量占比 **76%**（AhrefsBot 25%、vercel-favicon 14%、SemrushBot 8% 等）
- 函数平均耗时 **3,252ms**（最大 10,344ms），DB 连接在整个函数生命周期保持活跃
- Bot 请求间隔 **2-4 分钟**，卡在 Neon 5 分钟 autosuspend 阈值之内，compute 永不真正休眠
- 24h 内 Neon compute 启停 ~40 次

### 治理方案

| 层级 | 内容 | 预估改动量 | 影响范围 |
|:---|:---|:---|:---|
| Tier 1 止血 | vercel.json headers 边缘缓存 + Crawl-Delay + robots.txt Cache-Control | ~45 min | 静态资源、robots.txt |
| Tier 2 架构 | nuxt.config.ts routeRules (ISR/SWR) + SSG 预渲染 | ~3.5h | 所有公开动态页面 |
| Tier 3 深度 | Bot 分级缓存 + Vercel KV 持久化 | 评估中 | 全站 |

### 详细分析

见 [Vercel 缓存穿透与 Bot 流量治理](../design/governance/vercel-cache-bot-governance.md)。

---

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
