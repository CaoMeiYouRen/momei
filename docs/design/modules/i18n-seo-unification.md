# 国际化扩展与多语言 SEO 统一设计 (I18n Expansion & Multilingual SEO Unification)

## 1. 概述 (Overview)

本文档用于统一规划以下两个待办项：

- `国际化语言扩展与配置模块化`
- `多语言 SEO 深度优化`

这两项工作不能拆开孤立设计。原因在于：

- Locale 集合如何定义，会直接决定 `hreflang`、canonical、Open Graph、Twitter Card、JSON-LD 与 sitemap 的生成边界。
- 翻译文件如何拆分和加载，会直接决定页面在 SSR 阶段能否稳定产出本地化 Head 信息。
- 新语言是否允许启用，不能只看 UI 文案是否存在，还必须看该语言是否满足 SEO 准入条件，否则会把“不完整语种”暴露给搜索引擎。

因此，本轮设计采用一个统一主题推进：

**以 Locale Registry 作为单一事实源，同时驱动前端 i18n、后端语言识别、页面 Head 输出、结构化数据与站点地图生成。**

> 当前进度: 首轮基础设施已落地 `Locale Registry`、Nuxt i18n 多文件 lazy load、服务端模块化消息装配以及 sitemap 默认语言前缀中心化；当前又进一步落地了统一页面 SEO 契约，已覆盖首页、文章页、分类页、标签页的 Open Graph / Twitter Card / JSON-LD 输出，并为动态 sitemap URL 增加了基于翻译簇的 alternates。剩余工作主要集中在更细粒度的翻译域拆分、冗余词条清理、更多公开页接入与自动化回归校验。

## 2. 当前现状与问题 (Current State & Gaps)

### 2.1 已有基础

当前项目已经具备以下基础能力：

- `nuxt.config.ts` 已接入 `@nuxtjs/i18n` 与 `@nuxtjs/sitemap`。
- 当前前台使用 `prefix_and_default` 路由策略，默认语言 `zh-CN` 不带前缀，其他语言带前缀。
- `app.vue` 已通过 `useLocaleHead({ seo: true })` 输出基础多语言 Head 信息。
- `server/api/_sitemap-urls.ts` 已为文章、分类、标签生成多语言 URL。
- `server/routes/robots.txt.ts` 已考虑多语言路径下的后台与认证页屏蔽。

### 2.2 现有根因

当前实现仍存在以下根因性缺口：

1. **Locale 配置硬编码分散**
   - `defaultLocale`、语言列表、URL 前缀逻辑分散在 `nuxt.config.ts`、`app.vue`、`server/api/_sitemap-urls.ts` 等位置。
   - 后续一旦新增语言，极易遗漏 sitemap、Head、feed 或页面级 SEO 逻辑。

2. **翻译文件为单文件模型**
   - `i18n/locales/zh-CN.json` 与 `i18n/locales/en-US.json` 采用“大而全”的单 JSON 模式。
   - 不利于多人协作、模块隔离、增量扩展和按需加载。

3. **SEO 输出链路分散**
   - 页面层大量直接使用 `useHead()`，尚未形成统一的页面 SEO 契约。
   - 文章页、分类页、标签页虽然已有基础 title/description，但 `hreflang`、canonical、Open Graph、Twitter Card、JSON-LD 尚未形成统一的领域模型。

4. **语言启用缺乏准入机制**
   - 当前只支持双语，尚未明确“新语言何时可以暴露给用户”和“何时可以开放给搜索引擎抓取”。
   - 如果未来出现半完成语种，可能导致页面文案、Meta、结构化数据和 sitemap 同时不完整。

## 3. 统一设计目标 (Unified Goals)

### 3.1 目标

- 把当前双语言能力抽象为可配置 Locale 集合。
- 建立统一的 Locale 元数据模型，集中管理默认语言、回退策略、展示名称、SEO 行为与启用状态。
- 将翻译文件按模块拆分，形成可维护、可演进、可测试的目录结构。
- 建立页面级 SEO 契约，统一输出 title、description、canonical、`hreflang`、Open Graph、Twitter Card 与 JSON-LD。
- 让 sitemap、robots、feed、结构化数据与页面路由共享同一套 Locale Registry。
- 建立语言准入清单与 SEO 发布门禁，避免半完成语种对外暴露。

### 3.2 非目标

- 本阶段不引入多域名分语言部署。
- 本阶段不切换现有 `prefix_and_default` URL 策略，优先保证现有 URL 稳定与 SEO 连续性。
- 本阶段不追求所有页面一次性接入复杂结构化数据，优先覆盖首页、文章页、分类页、标签页等核心收录页。

## 4. 核心设计原则 (Core Principles)

### 4.1 Locale Registry 单一事实源

所有与语言相关的能力都必须从一份中心化配置读取，而不是在页面、接口或 sitemap 中各自硬编码。

统一公式如下：

$$
Locale Output = Registry + Route Mapping + Content Availability + SEO Policy
$$

其中：

- `Registry` 定义语言的元数据与启用边界。
- `Route Mapping` 定义当前页面在各语言下的 URL 形态。
- `Content Availability` 定义对应语言内容是否真正存在。
- `SEO Policy` 定义该语言是否可以被索引、是否进入 sitemap、是否输出 alternates。

### 4.2 i18n 与 SEO 共用一套“语言就绪度”模型

语言不能只按“开关”判断，而要区分至少三种状态：

- `draft`: 开发中，不对用户和搜索引擎公开。
- `ui-ready`: 已可供界面切换，但暂不进入搜索引擎索引。
- `seo-ready`: 允许输出 `hreflang`、canonical、JSON-LD 与 sitemap。

这使得未来新增语言时，可以先完成功能验证，再分阶段开放 SEO。

### 4.3 SSR 稳定优先

多语言 SEO 的核心前提是 SSR 输出稳定。因此：

- 页面级 SEO 必须在 SSR 阶段即可得到完整 locale、内容实体与站点配置。
- 不能依赖纯客户端异步逻辑去补 canonical、Open Graph 或结构化数据。
- 翻译模块拆分后，仍必须保证页面首屏所需的 Meta 文案在 SSR 阶段可取到。

## 5. 目标架构 (Target Architecture)

### 5.1 Locale Registry 设计

建议新增一份共享的 Locale 注册表，统一供 Nuxt i18n、服务端工具、SEO 工具和 sitemap 生成使用。

建议的数据结构如下：

```typescript
type LocaleReadiness = 'draft' | 'ui-ready' | 'seo-ready'

interface LocaleRegistryItem {
    code: string
    languageTag: string
    name: string
    nativeName: string
    isoName: string
    dir: 'ltr' | 'rtl'
    enabled: boolean
    default: boolean
    fallbackChain: string[]
    routePrefix: string
    readiness: LocaleReadiness
    switchable: boolean
    indexable: boolean
    sitemapEnabled: boolean
    feedEnabled: boolean
    ogLocale: string
    ogAlternateLocales: string[]
}
```

字段说明：

| 字段 | 作用 |
| :--- | :--- |
| `code` | 系统内部使用的 locale 标识，例如 `zh-CN`、`en-US`。 |
| `fallbackChain` | 定义该语言缺词时的回退链，不再只依赖全局单一默认值。 |
| `routePrefix` | 定义该语言在 URL 中的前缀表现。第一阶段继续兼容默认语言无前缀。 |
| `readiness` | 用于区分开发态、UI 可用态和 SEO 可索引态。 |
| `indexable` / `sitemapEnabled` | 将“可切换”与“可索引”拆开，避免 UI 与 SEO 发布耦死。 |
| `ogLocale` | 用于 Open Graph 的 locale 映射，如 `zh_CN`、`en_US`。 |

### 5.2 目录与模块拆分设计

建议将翻译资源从“单文件模式”迁移到“按 locale + 按模块拆分”的结构：

```plain
i18n/
  config/
    locale-registry.ts
    locale-readiness.ts
    locale-modules.ts
  locales/
    zh-CN/
      common.json
      auth.json
      admin.json
      post.json
      taxonomy.json
      seo.json
      feed.json
    en-US/
      common.json
      auth.json
      admin.json
      post.json
      taxonomy.json
      seo.json
      feed.json
```

推荐模块边界：

| 模块 | 内容范围 |
| :--- | :--- |
| `common` | 全局导航、按钮、错误消息、空状态等通用文案。 |
| `auth` | 登录、注册、密码找回、协议确认。 |
| `admin` | 后台菜单、设置页、列表页与表单文案。 |
| `post` | 文章页、阅读模式、版权、评论交互。 |
| `taxonomy` | 分类、标签、归档、列表筛选。 |
| `seo` | 站点级默认 Meta、Open Graph、Twitter Card、结构化数据文案模板。 |
| `feed` | RSS/Atom/JSON Feed 标题、描述与频道级文本。 |

### 5.3 加载策略

本阶段建议采用“模块拆分 + SSR 可用 + 渐进式懒加载”的折中方案：

1. **首屏必需模块同步可用**
   - `common` 与当前页面对应模块必须在 SSR 阶段可读取。
   - 例如文章页至少需要 `common + post + seo`。

2. **后台与低频模块可延迟加载**
   - `admin` 等非公开页面文案可按页面分组加载。

3. **SEO 文案单独成组**
   - 把 SEO 模板文案独立在 `seo.json`，避免页面 Meta 依赖大体积业务词条。

### 5.4 新语言准入清单

新增语言必须同时满足以下最小准入条件，才允许从 `draft` 升级到 `ui-ready` 或 `seo-ready`：

| 检查项 | `ui-ready` | `seo-ready` |
| :--- | :--- | :--- |
| `common/auth/post/seo` 基础模块已存在 | 必须 | 必须 |
| PrimeVue locale 已接入 | 必须 | 必须 |
| 默认导航与核心页面无缺词 | 必须 | 必须 |
| 首页、文章页、分类页、标签页 Meta 模板完整 | 建议 | 必须 |
| `hreflang` / canonical 可正确输出 | 建议 | 必须 |
| JSON-LD 可正确输出 `inLanguage` | 可选 | 必须 |
| sitemap 已接入并可回归校验 | 不要求 | 必须 |

设计结论：

- `draft` 语言不能进入切换器，也不能进入 sitemap。
- `ui-ready` 语言可以进入切换器，但默认不进入 sitemap、不输出对搜索引擎可见的 alternates。
- `seo-ready` 语言才允许进入完整 SEO 链路。

## 6. 多语言 SEO 统一模型 (Unified Multilingual SEO Model)

### 6.1 页面 SEO 契约

建议新增统一的页面 SEO 封装，例如：

- `composables/use-page-seo.ts`
- `utils/shared/seo/page-seo.ts`
- `server/utils/seo/locale-seo.ts`

统一输入模型可抽象为：

```typescript
interface PageSeoInput {
    type: 'home' | 'post' | 'category' | 'tag' | 'archive' | 'static'
    locale: string
    title: string
    description: string
    image?: string
    canonicalPath: string
    alternates?: Array<{ locale: string, path: string }>
    noindex?: boolean
    publishedAt?: string
    updatedAt?: string
    entityId?: string
}
```

页面层不再手工拼装大段 `useHead()`，而是只提供领域数据，统一交由 SEO 层生成：

- `title`
- `meta description`
- canonical
- `hreflang`
- Open Graph
- Twitter Card
- JSON-LD

### 6.2 canonical 与 hreflang 规则

统一规则如下：

1. **canonical 永远指向当前语言、当前实体的规范 URL**
   - 中文默认语言保持无前缀。
   - 非默认语言保持显式前缀。

2. **`hreflang` 只输出真正存在且 `seo-ready` 的语言版本**
   - 某文章如果只有中英版本，则不应输出并不存在的第三语言 alternate。
   - 某语言若仅 `ui-ready` 但未 `seo-ready`，也不应进入 `hreflang`。

3. **增加 `x-default`**
   - `x-default` 指向默认语言首页或默认语言实体页。
   - 便于搜索引擎理解站点的缺省落点。

### 6.3 Open Graph 与 Twitter Card

Open Graph 和 Twitter Card 必须做 locale 感知，但不应继续散落在页面中手工维护。

建议规则：

- `og:title`、`og:description` 跟随当前语言。
- `og:locale` 来自 Locale Registry 的 `ogLocale`。
- `og:locale:alternate` 来自所有 `seo-ready` alternate 语言。
- `twitter:title`、`twitter:description` 与当前语言一致。
- 站点级默认图、文章封面图都通过统一工具补全绝对 URL。

### 6.4 结构化数据 (JSON-LD)

本阶段优先覆盖以下页面：

| 页面类型 | JSON-LD 类型 | 关键字段 |
| :--- | :--- | :--- |
| 首页 | `WebSite` | `name`、`url`、`inLanguage` |
| 文章页 | `BlogPosting` | `headline`、`description`、`datePublished`、`dateModified`、`inLanguage`、`author` |
| 分类页 | `CollectionPage` 或 `Blog` | `name`、`description`、`inLanguage` |
| 标签页 | `CollectionPage` | `name`、`description`、`inLanguage` |

统一要求：

- `inLanguage` 必须来自当前 locale。
- 若存在多语言同源实体，可附带 alternate URL 信息，但只输出真实存在版本。
- JSON-LD 必须走服务端统一生成，避免客户端补丁式注入。

### 6.5 站点地图与 robots 统一策略

站点地图必须从 Locale Registry 和实体翻译关系共同生成，而不是仅依赖“实体 `language` 是否等于默认语言”的简单判断。

建议扩展规则：

1. `server/api/_sitemap-urls.ts` 不再本地硬编码默认语言。
2. sitemap 只收录：
   - 页面存在
   - 对应语言 `seo-ready`
   - 对应内容已发布且公开
3. 对文章、分类、标签等实体，后续可扩展为输出 alternates 信息。
4. `robots.txt` 继续复用现有后台/认证路径屏蔽规则，但 sitemap 地址来源也应与统一配置保持一致。

## 7. 路由与内容映射设计 (Route & Content Mapping)

### 7.1 现阶段路由决策

本阶段维持现有策略：

- 默认语言：无前缀
- 其他语言：显式前缀

原因：

- 现有 URL 已经被 sitemap、页面路由和语言切换逻辑使用。
- 在没有完成全量 301/站点地图/历史链接迁移设计前，不应贸然修改 URL 规范。

### 7.2 页面级 alternate 来源

页面 alternate 不能只基于 locale 列表生成，必须按页面类型区分：

- **静态页**: 来自固定路由映射。
- **文章页**: 来自文章 `translations` 关系。
- **分类/标签页**: 来自分类或标签的 `translations` 关系。
- **列表页/首页**: 来自 locale Registry 与路由规则。

即：

$$
Alternates = RouteExists \cap LocaleSeoReady \cap EntityTranslationExists
$$

## 8. 对应待办拆解 (Todo Breakdown)

### 8.1 对应待办 3: 国际化语言扩展与配置模块化

该待办在统一设计下应包含以下内容：

1. **多语言配置中心化**
   - 新增 Locale Registry，集中维护默认语言、可用语言、回退链、展示名、路由前缀与就绪度。
   - 将 `nuxt.config.ts`、服务端 locale 工具、sitemap 逻辑中的硬编码语言配置迁移到共享注册表。

2. **翻译文件模块化拆分**
   - 将当前 `zh-CN.json` / `en-US.json` 拆分为 `common`、`auth`、`admin`、`post`、`taxonomy`、`seo`、`feed` 等模块。
   - 为 SSR 提供页面所需模块的装配策略，避免页面 Meta 在首屏阶段拿不到翻译文本。

3. **语言准入与启用规则**
   - 建立 `draft -> ui-ready -> seo-ready` 的语言生命周期。
   - 规定哪些模块缺失时禁止进入切换器，哪些 SEO 能力缺失时禁止进入搜索索引。

4. **迁移与测试保障**
   - 设计旧版单文件翻译向模块化目录的迁移脚本或映射表。
   - 增补 locale registry、fallback、模块加载与缺词回退测试。

### 8.2 对应待办 4: 多语言 SEO 深度优化

该待办在统一设计下应包含以下内容：

1. **多语言元标签增强**
   - 建立统一页面 SEO 契约，收敛 title、description、canonical、`hreflang`、Open Graph、Twitter Card 的生成逻辑。
   - 让页面只提供领域数据，不再分散手写 Head 细节。

2. **结构化数据与站点地图深化**
   - 为首页、文章页、分类页、标签页补齐 locale-aware JSON-LD。
   - 扩展 sitemap 生成逻辑，使其只收录真实存在且 `seo-ready` 的语言页面。

3. **SSR 输出稳定化**
   - 明确所有核心 SEO 信息必须在 SSR 阶段可得。
   - 为页面级 SEO 数据准备与翻译加载制定统一装配顺序。

4. **自动化回归验证**
   - 为首页、文章页、分类页建立多语言 Head 快照或 E2E 断言。
   - 校验 canonical、`hreflang`、JSON-LD、sitemap URL 与 robots 声明的一致性。

## 9. 受影响文件规划 (Affected Files)

以下为后续实现阶段的主要受影响文件清单：

| 文件 | 规划改动 |
| :--- | :--- |
| `nuxt.config.ts` | 改为从共享 Locale Registry 读取语言配置与 i18n/sitemap 相关选项。 |
| `app.vue` | 将全局 `useLocaleHead` 与站点级 Head 收敛到统一 SEO 基础层。 |
| `server/api/_sitemap-urls.ts` | 去除默认语言硬编码，改为基于 registry + 内容可用性输出 URL。 |
| `server/routes/robots.txt.ts` | 与新的 sitemap/locale 配置统一。 |
| `server/utils/locale.ts` | 对齐新的 Locale Registry 与回退链模型。 |
| `pages/index.vue` | 接入统一页面 SEO 工具。 |
| `pages/posts/[id].vue` | 接入统一文章 SEO、alternates 与 JSON-LD 输出。 |
| `pages/categories/[slug].vue` | 接入统一 taxonomy SEO 输出。 |
| `pages/tags/[slug].vue` | 接入统一 taxonomy SEO 输出。 |
| `i18n/locales/**` | 从单文件模式迁移到按 locale + 模块拆分。 |
| `docs/design/modules/i18n.md` | 保留高层总览，细节以本文档为专项设计来源。 |

## 10. 测试与验证计划 (Testing & Validation)

### 10.1 单元与集成测试

- Locale Registry 解析测试
- fallback chain 测试
- 翻译模块加载与缺词回退测试
- sitemap URL 生成测试
- SEO 组装工具测试
- JSON-LD 生成测试

### 10.2 页面级回归测试

优先覆盖以下页面：

- 首页
- 文章详情页
- 分类页
- 标签页

每个页面至少校验：

- title
- description
- canonical
- `hreflang`
- `og:locale`
- JSON-LD 中的 `inLanguage`

### 10.3 搜索引擎交付验证

在接入层面，至少验证以下输出一致性：

- 页面 Head 中的 canonical 与 sitemap URL 一致。
- `hreflang` 只包含真实存在页面。
- `robots.txt` 能正确指向站点地图入口。

## 11. 分阶段落地顺序 (Implementation Sequence)

建议按以下顺序推进，而不是把两个待办拆成两个彼此独立的实现流：

1. 建立 Locale Registry 与语言就绪度模型。
2. 完成翻译文件模块化拆分和旧结构迁移。
3. 建立统一页面 SEO 契约与通用工具。
4. 改造文章页、分类页、标签页、首页的 SEO 输出。
5. 改造 sitemap 与 robots 链路。
6. 补齐自动化测试与回归校验。

## 12. 结论 (Conclusion)

本轮规划的核心结论是：

- `国际化语言扩展与配置模块化` 负责建立可扩展、可治理的 Locale 基础设施。
- `多语言 SEO 深度优化` 负责消费这套基础设施，把语言配置稳定地转化为搜索引擎可理解的页面输出。
- 两者共享同一条主线，即 **Locale Registry -> Translation Modules -> Page SEO Contract -> Sitemap / Structured Data**。

只有按照这条主线推进，后续新增第三语言、第四语言时，项目才不会重复陷入“UI 能切语言，但 SEO 不完整”的局部修补状态。
