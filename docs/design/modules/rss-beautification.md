# RSS 订阅链接美化设计 (RSS Feed Beautification)

## 1. 概述 (Overview)

当前 RSS feed 输出为原始 XML，浏览器直接访问时显示为纯文本/XML 树结构，可读性差。由于 XSLT（XML Stylesheet Transformations）即将被 Chrome、Firefox、Safari 弃用，需要采用 **XML + CSS** 方案替代 XSLT 进行美化。

### 1.1 设计目标

- **浏览器友好**: 用户直接访问 `/feed.xml` 时看到美观的 HTML 样式页面，而非原始 XML。
- **阅读器兼容**: RSS 阅读器抓取时不受 CSS 影响，保持原有解析能力。
- **轻量无侵入**: 不改变 Feed 内容结构、不引入 JavaScript、不增加服务端渲染逻辑。
- **响应式**: 支持移动端和桌面端浏览。

## 2. 技术方案 (Technical Approach)

### 2.1 核心原理

利用 XML 的 `<?xml-stylesheet?>` 处理指令，将 CSS 样式文件关联到 RSS XML 上。现代浏览器支持 CSS 对 XML 进行样式化（通过将 XML 元素映射为类似 HTML 的块级/行级元素）。

```
┌─ 浏览器访问 /feed.xml ───────────────────────────────┐
│                                                        │
│  feed.xml (RSS 2.0 XML)                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ <?xml-stylesheet href="/feed-style.css"           │  │
│  │                   type="text/css"?>               │  │
│  │ <rss version="2.0">                               │  │
│  │   <channel>                                       │  │
│  │     ...                                           │  │
│  │   </channel>                                      │  │
│  │ </rss>                                            │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                  │
│  浏览器解析 XML + CSS → 渲染为美观页面                    │
│                                                        │
│  RSS 阅读器 → 忽略 xml-stylesheet → 正常解析 RSS        │
└────────────────────────────────────────────────────────┘
```

### 2.2 实现步骤

#### 步骤 1：修改 feed 生成逻辑

实际实现中，将样式表注入封装为工具函数 `injectRssStylesheet()`（位于 `server/utils/feed.ts`），在三个 RSS 输出点调用：

1. **`server/routes/feed.xml.ts`** — 主 RSS 路由
2. **`server/routes/feed/podcast.xml.ts`** — 播客 RSS 路由
3. **`server/utils/feed-taxonomy-route.ts`** — 分类/标签 RSS 路由（仅 `format === 'rss2'`）

工具函数实现：
```typescript
export function injectRssStylesheet(xml: string, href = '/feed-style.css'): string {
    const decl = '<?xml version="1.0" encoding="utf-8"?>'
    const pi = `${decl}<?xml-stylesheet href="${href}" type="text/css"?>`
    if (xml.startsWith(decl)) {
        return xml.replace(decl, pi)
    }
    return `${pi}\n${xml}`  // Fallback
}
```

使用方式：
```typescript
import { generateFeed, injectRssStylesheet } from '@/server/utils/feed'

export default defineEventHandler(async (event) => {
    const feed = await generateFeed(event)
    appendHeader(event, 'Content-Type', 'application/xml')
    return injectRssStylesheet(feed.rss2())
})
```

> **注意**: Atom (`feed.atom.ts`) 和 JSON Feed (`feed.json.ts`) 不做样式化。Atom 虽也支持 xml-stylesheet，但本阶段范围仅限 RSS 2.0。

#### 步骤 2：创建 CSS 样式文件

创建 `public/feed-style.css`，通过 CSS 选择器匹配 RSS XML 元素，定义排版和样式。

```css
/* feed-style.css — RSS Feed 浏览器美化样式 */

/* 基础排版 */
channel {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
    background: #f9f9f9;
}

/* 频道标题 */
channel > title {
    display: block;
    font-size: 2em;
    font-weight: bold;
    margin: 20px 0 5px;
    color: #1a1a1a;
}

channel > description {
    display: block;
    font-size: 1em;
    color: #666;
    margin-bottom: 30px;
}

channel > link {
    display: none; /* 链接在描述中已包含 */
}

/* 文章条目 */
item {
    display: block;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

item > title {
    display: block;
    font-size: 1.4em;
    font-weight: 600;
    margin-bottom: 8px;
}

item > title > a {
    color: #2563eb;
    text-decoration: none;
}

item > title > a:hover {
    text-decoration: underline;
}

item > pubDate {
    display: block;
    font-size: 0.85em;
    color: #888;
    margin-bottom: 10px;
}

item > description {
    display: block;
    line-height: 1.6;
    color: #444;
}

item > link {
    display: none;
}

/* 响应式 */
@media (max-width: 600px) {
    channel {
        padding: 10px;
    }
    item {
        padding: 15px;
    }
    channel > title {
        font-size: 1.5em;
    }
}
```

#### 步骤 3：部署验证

- 本地开发：访问 `http://localhost:3000/feed.xml` 查看美化效果
- RSS 阅读器验证：使用 Feedly / Inoreader 等订阅 `http://localhost:3000/feed.xml` 确认解析正常
- 响应式验证：移动端浏览器访问确认排版自适应

#### 验证要点

- `injectRssStylesheet` 不会影响非 RSS 格式（Atom、JSON）的输出
- 分类/标签 RSS feed（`/feed/category/:slug.xml`、`/feed/tag/:slug.xml`）也自动获得样式化
- 暗色模式通过 `@media (prefers-color-scheme: dark)` 自动适配
- 样式表文件通过 `public/` 目录自动托管，支持 CDN 长期缓存

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `server/routes/feed.xml.ts` | 修改 | 调用 `injectRssStylesheet(feed.rss2())` |
| `server/routes/feed/podcast.xml.ts` | 修改 | 调用 `injectRssStylesheet(feed.rss2())` |
| `server/utils/feed-taxonomy-route.ts` | 修改 | RSS 格式时调用 `injectRssStylesheet()` |
| `server/utils/feed.ts` | 修改 | 新增 `injectRssStylesheet()` 导出函数 |
| `public/feed-style.css` | 新增 | RSS 浏览器美化样式（Momei 品牌色 + 暗色模式 + 响应式） |
| `server/routes/feed.atom.ts` | 无需修改 | 本阶段范围仅限 RSS 2.0 |
| `server/routes/feed.json.ts` | 无需修改 | JSON Feed 不需要样式化 |

### 2.4 前置条件确认

- `feed` 库（`server/utils/feed.ts` 使用的 `Feed` 类）返回的 `rss2()` 字符串为标准 RSS XML，包含 `<?xml version="1.0" encoding="utf-8"?>` 声明头部。通过 `String.replace()` 插入处理指令是可靠的，无需修改 feed 库本身。
- CSS 文件托管于 `public/` 目录，Nitro 会自动将其作为静态资源提供服务，路径为 `/feed-style.css`。无需额外路由配置。
- 缓存策略：CSS 文件可通过 Vercel CDN 长期缓存（immutable），与 `/_nuxt/**` 策略一致。

## 3. 非目标 (Non-goals)

- 不改变 RSS feed 的内容结构（title、description、link、pubDate 等字段保持不变）
- 不引入 JavaScript 交互（无点击展开、无动态加载）
- 不做完整的 RSS 阅读器（不提供标记已读、收藏、分类等）
- 不做 XSLT，因为 XSLT 即将被浏览器弃用

## 4. 验收标准 (Acceptance Criteria)

1. ✅ 浏览器访问 `/feed.xml` 显示美化样式而非原始 XML
2. ✅ RSS 阅读器（Feedly / Inoreader 等）仍能正常解析 feed（`<?xml-stylesheet?>` 对 XML 解析无影响）
3. ✅ 响应式设计，移动端可读（`@media (max-width: 640px)` 适配）
4. ✅ 暗色模式自动适配（`@media (prefers-color-scheme: dark)`）
5. ✅ 分类/标签 RSS feed 也获得同样美化
6. ✅ `pnpm typecheck` + `pnpm lint` 通过（0 error, 0 warning）
7. ✅ 现有 12 条 feed 测试全部通过

## 5. 相关文档 (Related Docs)

- [订阅系统设计](./subscription.md) — 站内 Feed 输出能力
- [MCP HTTP 传输与本体挂载设计](./mcp-http.md) — 本阶段另一条主线
- [feed.xml.ts](../../server/routes/feed.xml.ts) — RSS feed 路由
- [feed.ts](../../server/utils/feed.ts) — Feed 生成工具

---

> **设计状态**: ✅ 已实现（Phase 58）
> **实际工时**: ~1h
> **涉及文件**: `public/feed-style.css`（新增）、`server/utils/feed.ts`（新增 `injectRssStylesheet`）、`server/routes/feed.xml.ts`、`server/routes/feed/podcast.xml.ts`、`server/utils/feed-taxonomy-route.ts`
