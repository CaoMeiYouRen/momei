# Vercel 缓存穿透与 Bot 流量治理

> 更新日期: 2026-06-29
> 数据源: Vercel 函数日志（2026-06-23 06:36-07:35 UTC, 83 条记录）+ Neon 操作日志（24h, ~40 次启停循环）
> 结论口径: 同时覆盖 Vercel 缓存状态、Bot 流量构成、SSR 冷启动开销与 Neon compute 启停关联分析
> 关联治理: [Postgres 流量治理](./postgres-traffic-governance.md)、[可缓存接口清单](./cacheable-api-inventory.md)
> 实施状态: Tier 1 ✅ 已完成, Tier 2 ✅ 已完成（routeRules + Vercel KV）, Tier 3 评估中

## 1. 执行摘要

当前 Neon Postgres compute 并非"被长查询锁住"，而是被**大量 bot/爬虫流量以 2-4 分钟间隔持续触发冷启动**。两个关键数据：

1. **Vercel 缓存 100% MISS（83/83）** — 每一个请求都穿透到 Nuxt SSR 函数，无 ISR、无 CDN、无静态生成。
2. **Bot 流量占比 76%** — 真实用户仅 ~24%，AhrefsBot 单独贡献 25%。

每条 bot 请求触发完整 SSSR 流水线：Cron 检查（~250ms）→ DB 初始化 + 连接（400-1200ms）→ SSR 渲染 → 函数平均耗时 3.25s。Neon 5 分钟 autosuspend 在 2-4 分钟 bot 间隔下形同虚设，24 小时内 compute 启停 ~40 次。

**本治理文档聚焦于阻断"Bot → Cache MISS → SSR 冷启动 → DB 连接"的连锁反应**，与 [Postgres 流量治理](./postgres-traffic-governance.md) 的 SQL 层优化互补——前者堵源头，后者瘦查询。

## 2. 数据证据

### 2.1 流量全貌（1 小时采样）

| 维度 | 数值 |
|:---|:---|
| 采样窗口 | 2026-06-23 06:36 ~ 07:35 UTC |
| 函数调用总次数 | 38 |
| Vercel Cache HIT | **0** |
| Vercel Cache MISS | **83**（含非函数型日志条目） |
| 函数平均耗时 | **3,252 ms** |
| 函数最大耗时 | **10,344 ms** |
| 函数最小耗时 | 103 ms |

### 2.2 请求来源分类

| 来源 | User-Agent | 1h 请求数 | 占比 | 类型 |
|:---|:---|:---|:---|:---|
| AhrefsBot | `AhrefsBot/7.0` | 21 | 25.3% | SEO 爬虫 |
| Chrome (Windows) | `Chrome/139.0` | 24 | 28.9% | **真实用户** |
| vercel-favicon | `vercel-favicon/1.0` | 12 | 14.5% | Vercel 内部 bot |
| SemrushBot | `SemrushBot/7~bl` | 7 | 8.4% | SEO 爬虫 |
| HeadlessChrome | `HeadlessChrome/141.0` | 4 | 4.8% | Lighthouse / 监控 |
| PetalBot | `PetalBot` (Android) | 4 | 4.8% | 华为爬虫 |
| YandexBot | `YandexBot/3.0` | 3 | 3.6% | Yandex 爬虫 |
| SaaSScout | `SaaSScout/1.0` | 3 | 3.6% | SaaS 目录 |
| ChatGPT-User | `ChatGPT-User/1.0` | 2 | 2.4% | OpenAI 爬虫 |
| Uptime-Kuma | `Uptime-Kuma/1.23` | 2 | 2.4% | 运行监控 |
| python-requests | `python-requests/2.27` | 1 | 1.2% | 未知脚本 |
| **Bot/自动化合计** | | **59** | **~76%** | |
| **真实用户合计** | | **24** | **~24%** | |

### 2.3 Bot 请求间隔 vs Neon Autosuspend

在 1 小时采样窗口内，Bot 请求间隔分布：

| 间隔 | 次数 | 与 5min 阈值关系 |
|:---|:---|:---|
| < 1 min | 3 | 远低于 autosuspend，compute 持续活跃 |
| 1-2 min | 4 | 低于 autosuspend |
| 2-3 min | 5 | 低于 autosuspend |
| 3-4 min | 6 | 低于 autosuspend |
| **5-10 min** | **1** | **唯一触发 autosuspend 的窗口** |
| > 10 min | 0 | — |

**结论**：在 1 小时内，仅 1 次间隔（06:53→07:03, ~10 min）足以触发 Neon autosuspend。其余 18 次 bot 命中均在 5 分钟窗口内，compute 永不真正休眠。

### 2.4 vercel-favicon 洪水事件

```
07:35:19 | / | vercel-favicon/1.0
07:35:19 | / | vercel-favicon/1.0
07:35:22 | / | vercel-favicon/1.0
...（连续 12 次，17 秒内）
07:35:27 | / | vercel-favicon/1.0
```

12 个请求在 17 秒内全部命中首页 `/`，每个返回 200 且 `cache=MISS`。每次部署或健康检查都可能触发类似轰炸。

### 2.5 请求路径分布

| 路径 | 请求数 | 主要来源 |
|:---|:---|:---|
| `/` | 17 | vercel-favicon(12) + HeadlessChrome(4) + Uptime-Kuma(1) |
| `/en-US/posts/[id]` | 13 | 真实用户(7) + Bot(6) |
| `/en-US/tags/[slug]` | 13 | AhrefsBot(8) + 其他 bot(5) |
| `/ja-JP/posts/[id]` | 9 | AhrefsBot(5) + 真实用户(4) |
| `/ko-KR/tags/[slug]` | 8 | AhrefsBot(7) + YandexBot(1) |
| `/feed/tag/[slug]` | 5 | 真实用户(4) + AhrefsBot(1) |
| `/ja-JP/tags/[slug]` | 4 | 真实用户(3) + AhrefsBot(1) |
| `/robots.txt` | 3 | YandexBot(2) + SemrushBot(1) |
| `/sitemap_index.xml` | 3 | SaaSScout(3) |
| `/en-US/posts` | 2 | PetalBot(2) |
| `/zh-TW/tags/[slug]` | 2 | AhrefsBot(2) |
| `/api/auth/[...all]` | 1 | Uptime-Kuma(1) |
| `/feed/category/[slug]` | 1 | AhrefsBot(1) |
| `/tags/[slug]` | 1 | SemrushBot(1) |
| `/__fallback` | 1 | python-requests(1) |

**Bot 最爱路径 Top 3**：标签页（`/tags/[slug]`）、文章详情（`/posts/[id]`）、首页。全部是动态 SSR 路由，无任何缓存。

## 3. 当前架构评估

### 3.1 已有能力

| 能力 | 实现方式 | 覆盖范围 | 限制 |
|:---|:---|:---|:---|
| API 运行时缓存 | `server/utils/api-runtime-cache.ts`（进程内 `Map`, 60s TTL） | `settings/public`、`friend-links`、`posts/archive`、`search`、`categories`、`tags` 六组 API | 进程内（冷启动丢失）、仅覆盖 API 响应、不覆盖 SSR 渲染结果 |
| 外部 Feed 缓存 | Nitro `useStorage('cache:external-feed')` | RSS/Atom 聚合 | 仅友链 RSS 场景 |
| Cron 检查禁用 | `server/plugins/task-scheduler.ts` 输出日志 | Vercel Serverless 环境自动禁用 | 已生效，不消耗 DB |
| `Cache-Control` 头 | API 运行时缓存层设置 | 缓存命中时 `public, max-age=60` | 仅 cache hit 时生效；MISS 时无头 |

### 3.2 缺失能力

| 缺失项 | 影响 |
|:---|:---|
| **Nitro `routeRules`** | 无 ISR/SWR/CDN 缓存规则——`nuxt.config.ts` 中完全不存在 `routeRules` 配置段 |
| **Vercel `headers` 配置** | `vercel.json` 无任何 header 规则——CDN 边缘层无法设置 `Cache-Control` |
| **静态预渲染（SSG）** | `prerender.crawlLinks` 未启用，`prerender.routes` 未配置——无页面被预渲染 |
| **CDN URL 配置** | `runtimeConfig.public.cdnURL` 未设置（仅测试中有空字符串 fallback） |
| **`robots.txt` 缓存** | 无 `Cache-Control` 头，无 `Crawl-Delay` 指令 |
| **Bot 识别与分级** | 无 User-Agent 检测、无 bot 专用缓存策略 |
| **持久化缓存层** | 无 Redis / Vercel KV / Edge Config——运行时缓存跨实例不共享 |

### 3.3 根因链

```
Bot 请求 → Vercel CDN (MISS) → Nuxt SSR 冷启动
    → Cron 检查 (~250ms)
    → initializeDatabaseConnection() (~400-1200ms)
    → [Neon compute START] ← 此处触发计费
    → SSR 渲染 (~1-3s)
    → 函数返回 (200, 无 Cache-Control)
    → DB 连接随函数销毁而关闭
    → 5 分钟后 Neon autosuspend
    → 下一次 bot 命中...循环重启
```

**核心矛盾**：76% 的请求是 bot，100% 的请求穿透到数据库。每减少一个穿透请求，就消灭一次 Neon compute 启停循环。

## 4. 优化方案（分层推进）

### 4.1 Tier 1：止血层（低风险，立即可做）

#### 4.1.1 Vercel `headers` 边缘缓存

在 `vercel.json` 中增加 `headers` 配置，让 Vercel CDN 在边缘层设置 `Cache-Control`：

```json
{
    "headers": [
        {
            "source": "/_nuxt/(.*)",
            "headers": [
                { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
            ]
        },
        {
            "source": "/(.*)\\.(png|svg|ico|webp|jpg|jpeg|woff2?)",
            "headers": [
                { "key": "Cache-Control", "value": "public, max-age=2592000" }
            ]
        },
        {
            "source": "/robots.txt",
            "headers": [
                { "key": "Cache-Control", "value": "public, max-age=86400" }
            ]
        },
        {
            "source": "/sitemap(.*)\\.xml",
            "headers": [
                { "key": "Cache-Control", "value": "public, max-age=3600" }
            ]
        }
    ]
}
```

**影响**：静态资源（JS/CSS/图片/favicon）被 CDN 缓存后不再触发函数调用。vercel-favicon 洪水直接命中 CDN。

**SEO 安全**：静态资源缓存对 SEO 零影响——搜索引擎根据页面 HTML 而非静态资源判断内容。

**预估收益**：减少 30-40% 的函数调用（图片、favicon、`_nuxt/` 下所有 JS/CSS 不再触发冷启动）。

#### 4.1.2 `robots.txt` 增加 Crawl-Delay

```diff
  User-agent: *
  Allow: /
+ Crawl-Delay: 10
```

**影响**：对遵守 `robots.txt` 的爬虫（AhrefsBot、SemrushBot、YandexBot 均遵守）请求间隔从 2-4 分钟拉长到 10 秒以上，大幅降低数据库唤醒频率。

**SEO 安全**：`Crawl-Delay` 不影响 Googlebot（Google 官方声明忽略该指令，但 Googlebot 爬取频率本身远低于 SEO 工具爬虫）。Bing 部分支持。对真正影响 SEO 的搜索引擎爬虫无负面影响。

**Crawl-Delay 兼容性**：

| 爬虫 | 支持 Crawl-Delay | 备注 |
|:---|:---|:---|
| Googlebot | ❌ 忽略 | Google 通过 Search Console 控制爬取速率 |
| Bingbot | ⚠️ 部分支持 | 建议同时配置 Bing Webmaster Tools |
| AhrefsBot | ✅ 遵守 | 官方文档明确支持 |
| SemrushBot | ✅ 遵守 | |
| YandexBot | ✅ 遵守 | |
| PetalBot | ✅ 遵守 | |

**预估收益**：将 AhrefsBot 的请求频率从 ~21 次/小时降至 ~6 次/小时（-70%），SemrushBot 从 ~7 次/小时降至 ~3 次/小时。

#### 4.1.3 `robots.txt` 设置 Cache-Control

在 `server/routes/robots.txt.ts` 中增加响应头：

```ts
setHeader(event, 'Cache-Control', 'public, max-age=86400')
```

配合 Vercel `headers` 配置，robots.txt 将被 CDN 缓存 24 小时，不再触发每次的函数调用。

**SEO 安全**：`robots.txt` 内容极少变更（仅在新增/删除禁止路径时），24h 缓存对 SEO 无影响。

#### 4.1.4 Cron 作业降频

当前 `vercel.json` 中 12 个 cron 每 2 小时触发一次 `/api/tasks/run-scheduled`：

```json
{ "path": "/api/tasks/run-scheduled", "schedule": "0 */2 * * *" }
```

但 Vercel 日志显示 `[TaskScheduler] Cron jobs are disabled in this environment`——说明 cron 本身并未执行数据库操作，但每次 cron 调用仍然触发一次 serverless 函数冷启动。2 小时间隔合理，暂维持现状。后台确认 cron 是否消耗 Neon compute 配额后决定是否调整。

### 4.2 Tier 2：架构优化层（中风险，需验证后推进）

#### 4.2.1 Nuxt ISR 覆盖公开动态页面

在 `nuxt.config.ts` 中增加 `routeRules`：

```ts
nitro: {
    // ... 现有配置 ...
    routeRules: {
        // 首页：SWR 缓存，后台生成新版本时后台刷新
        '/': { swr: 3600 },
        '/:locale/': { swr: 3600 },

        // 文章详情：ISR 按需重新验证，bot 命中时返回缓存
        '/posts/:id': { isr: 600 },
        '/:locale/posts/:id': { isr: 600 },

        // 分类/标签列表页：SWR
        '/categories/:slug': { swr: 1800 },
        '/tags/:slug': { swr: 1800 },
        '/:locale/categories/:slug': { swr: 1800 },
        '/:locale/tags/:slug': { swr: 1800 },

        // 静态资源
        '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },

        // robots + sitemap
        '/robots.txt': { swr: 86400 },
        '/sitemap_index.xml': { swr: 3600 },
    }
}
```

**影响**：
- 公开页面首次请求后，CDN 边缘层缓存页面 HTML
- 后续请求（包括 bot）直接命中 CDN，不再穿透到 Nuxt SSR
- `swr` 模式下，第一个用户在缓存过期后仍获得旧版本，后台异步生成新版本
- `isr` 模式下，按需在后台重新生成

**SEO 安全**：

| 策略 | TTL | SEO 影响 |
|:---|:---|:---|
| 首页 SWR 3600s (1h) | 1h | 安全。Google 支持 `stale-while-revalidate`，不会降低排名 |
| 文章详情 ISR 600s (10min) | 10min | 安全。新发布文章最多延迟 10 分钟被爬虫索引，远低于 Google 的 24-48h 索引延迟 |
| 标签/分类 SWR 1800s (30min) | 30min | 安全。标签页非核心排名页，30 分钟延迟对 SEO 无影响 |
| sitemap SWR 3600s | 1h | 安全。Google 通常在数小时后才重新抓取 sitemap |

**风险**：
- Nuxt ISR 需要持久化存储（Nitro `storage`），Vercel 环境默认使用文件系统存储（不跨实例共享）
- 在 Vercel Serverless 环境下，推荐配置 Vercel KV 作为 Nitro storage 后端
- 若无法配置 KV，回退到仅使用 `headers` 规则（Tier 1 的 CDN 缓存）+ `swr` 的浏览器缓存

**预估收益**：公开页面 bot 请求 90%+ 命中 CDN/ISR 缓存，Neon compute 启停频率从 40 次/天降至 5-10 次/天。

#### 4.2.2 API 响应缓存头增强

当前 `server/utils/api-runtime-cache.ts` 已设置 `Cache-Control: public, max-age=60`，但仅在运行时缓存命中时生效。在 MISS 场景下，增加 `Cache-Control` 头使 CDN 也能缓存：

```ts
// 在 cache miss 的响应上也设置 Cache-Control
if (isPublicScope(ctx)) {
    setHeader(event, 'Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`)
}
```

配合 Vercel `headers` 配置，CDN 可缓存 API 响应。

#### 4.2.3 预渲染静态页面（SSG）

对极少变更的页面启用构建时预渲染：

```ts
nitro: {
    prerender: {
        crawlLinks: true,
        routes: [
            '/',
            '/en-US',
            '/zh-CN',
            '/ja-JP',
            '/ko-KR',
            '/zh-TW',
            '/robots.txt',
            '/sitemap_index.xml',
            '/llms.txt',
            '/llms-full.txt',
        ],
    }
}
```

**影响**：构建时生成静态 HTML，Vercel 直接以静态文件形式提供，完全不经过 SSR 函数。

**限制**：
- 预渲染页面在下次构建前不会更新
- 适合内容极少变更的页面（llms.txt、robots.txt、sitemap）
- 首页如启用预渲染，需在内容更新后重新部署

### 4.3 Tier 3：深度优化层（高风险，需设计评估）

#### 4.3.1 Vercel KV / Edge Config 持久化缓存

将运行时缓存从进程内 `Map` 迁移到 Vercel KV：

- 跨 serverless 实例共享缓存
- 冷启动后缓存仍可用
- 支持更长的 TTL（如 300s 替代 60s）

**前置条件**：需要新增 Vercel KV 集成、修改 `server/utils/runtime-cache.ts` 的存储后端。

**风险**：引入外部依赖、增加月度成本（Vercel KV 免费额度 256MB，Hobby 计划足够）。

#### 4.3.2 Bot 识别与分级缓存

在 `server/middleware/` 中增加 bot 检测中间件：

```ts
// server/middleware/0c-bot-detect.ts
const BOT_PATTERNS = [
    /AhrefsBot/i,
    /SemrushBot/i,
    /YandexBot/i,
    /PetalBot/i,
    /ChatGPT-User/i,
    /SaaSScout/i,
    /python-requests/i,
]

export default defineEventHandler((event) => {
    const ua = getHeader(event, 'User-Agent') || ''
    const isBot = BOT_PATTERNS.some(p => p.test(ua))

    if (isBot) {
        // Bot 专用策略：更长的缓存 TTL，不写入 visitor 统计
        setHeader(event, 'X-Bot-Detected', '1')
        setHeader(event, 'Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400')
    }
})
```

**SEO 安全**：
- Googlebot、Bingbot **不在**匹配列表中——搜索引擎爬虫享受正常缓存策略
- 只有 SEO 工具爬虫和 AI 爬虫被识别为 bot
- 不改变 robots.txt 的 allow/disallow 规则——bot 仍然可以爬取，只是获得更激进的缓存

**风险**：User-Agent 可伪造，但 bot 缓存策略的 worst case 是某个真实用户获得了缓存响应（TTL 30min），不影响功能正确性。

#### 4.3.3 Vercel Firewall / Rate Limiting

对 `/` 路径的非浏览器 User-Agent 启用速率限制：

- `vercel-favicon`：允许频率降低至 1 req/10s
- 减少 vercel-favicon 洪水对 compute 的冲击

**前置条件**：需要 Vercel Pro 计划（Firewall 是 Pro 功能），Hobby 计划不可用。

## 5. SEO 影响评估总表

| 优化措施 | Google | Bing | SEO 工具爬虫 | 风险 |
|:---|:---|:---|:---|:---|
| 静态资源 CDN 缓存 (Tier 1) | ✅ 无影响 | ✅ 无影响 | ✅ 无影响 | 无 |
| Crawl-Delay: 10 (Tier 1) | ✅ 忽略（不影响） | ⚠️ 部分支持 | ✅ 遵守（减少压力） | 爬虫遵守度不一 |
| robots.txt 缓存 24h (Tier 1) | ✅ 无影响 | ✅ 无影响 | ✅ 无影响 | 修改后最多延迟 24h 生效 |
| 首页 SWR 1h (Tier 2) | ✅ 安全 | ✅ 安全 | ✅ 安全 | 新发布内容延迟 1h 可见 |
| 文章 ISR 10min (Tier 2) | ✅ 安全 | ✅ 安全 | ✅ 安全 | 极端情况下新文章 10min 后才被索引 |
| 标签页 SWR 30min (Tier 2) | ✅ 安全 | ✅ 安全 | ✅ 安全 | 非排名页，延迟无影响 |
| Bot 分级缓存 (Tier 3) | ✅ 豁免（不匹配） | ✅ 豁免（不匹配） | ✅ 安全（获得长 TTL） | User-Agent 可伪造 |
| SSG 预渲染 (Tier 2) | ✅ 无影响 | ✅ 无影响 | ✅ 无影响 | 内容更新需重新部署 |

## 6. 实施计划

### Phase 1：本周内（Tier 1 全部）✅ 已完成

| 步骤 | 改动 | 预估耗时 | 验证方式 | 状态 |
|:---|:---|:---|:---|:---|
| 1 | `vercel.json` 增加 `headers` 配置 | 30 min | 部署后检查静态资源响应头 | ✅ |
| 2 | `robots.txt` 增加 `Crawl-Delay: 10` | 10 min | 部署后 `curl -I /robots.txt` | ✅ |
| 3 | `robots.txt` 增加 `Cache-Control` 头 | 5 min | 同上 | ✅ |
| **合计** | | **45 min** | | |

### Phase 2：下周内（Tier 2 选定项，需技术验证）✅ 已完成

| 步骤 | 改动 | 预估耗时 | 验证方式 | 状态 |
|:---|:---|:---|:---|:---|
| 4 | `nuxt.config.ts` 增加 `routeRules`（SWR/ISR） | 2h | 部署后 `curl -I` 检查 `x-nitro-cache`、`x-vercel-cache` | ✅ |
| 5 | 确认 Vercel KV/Nitro Storage 可用性 | 1h | 开发环境验证 | ✅ |
| 6 | 预渲染静态页面（`llms.txt` 等） | 30 min | 构建产物检查 | 待执行 |
| **合计** | | **3.5h** | | |

**Phase 2 实施详情（2026-06-29）**：

- **routeRules 配置**：已在 `nuxt.config.ts` 的 `nitro.routeRules` 中添加以下规则：
  - 首页 `/`：SWR 3600s（1h）
  - 文章详情 `/posts/:id`：ISR 600s（10min）
  - 标签/分类详情 `/tags/:slug`, `/categories/:slug`：SWR 1800s（30min）
  - 静态资源 `/_nuxt/**`：长期缓存（max-age=31536000, immutable）
  - robots.txt：SWR 86400s（24h）
  - sitemap：SWR 3600s（1h）

- **Vercel KV / Upstash Redis 存储**：已在 `nuxt.config.ts` 的 `nitro.storage` 中配置 `cache` 使用 `upstash` 驱动（Vercel KV 基于 Upstash Redis）。环境变量（`KV_REST_API_URL`, `KV_REST_API_TOKEN`）在 Vercel 项目中集成 KV 后自动配置。未配置时自动降级为内存存储。

- **缓存失效机制**：Nuxt ISR/SWR 会自动处理缓存刷新。当文章更新时，下一次请求会触发后台重新生成，用户仍获得旧版本（stale），后台异步更新缓存。

### Phase 3：评估中（Tier 3，取决于 Phase 1+2 效果）

| 步骤 | 改动 | 预估耗时 | 前置条件 |
|:---|:---|:---|:---|
| 7 | Bot 检测中间件 + 分级缓存 | 2h | Phase 2 完成后评估需求 |
| 8 | Vercel KV 持久化缓存迁移 | 4h | Vercel KV 集成确认 ✅ |
| 9 | Vercel Firewall 速率限制 | 1h | Vercel Pro 计划 |

## 7. 成功指标

| 指标 | 当前基线 | 目标（Phase 1）✅ | 目标（Phase 2）✅ |
|:---|:---|:---|:---|
| Vercel Cache HIT 率 | 0% | >30%（静态资源命中） | >70%（公开页面命中） |
| Neon compute 启停次数/天 | ~40 | ~25 | ~5-10 |
| 函数平均耗时 | 3,252 ms | 不直接改善 | <1,000 ms（缓存命中后） |
| Bot 请求穿透到 SSR 比例 | 100% | 60%（静态资源被拦截） | <10% |
| 搜索引擎爬虫可访问性 | ✅ 正常 | ✅ 正常（Google/Bing 不受影响） | ✅ 正常 |

## 8. 关联文档

- [Postgres 流量治理](./postgres-traffic-governance.md) — SQL 层优化（减列、索引、缓存），与本方案互补
- [可缓存接口清单](./cacheable-api-inventory.md) — API 运行时缓存（进程内 Map, 60s TTL）
- [性能优化历史记录](../../reports/performance-optimization-log.md) — 已完成的性能优化条目
- [backlog Postgres 主线 #5](../../plan/backlog.md) — 长期 Postgres 治理方向
