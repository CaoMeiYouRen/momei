# i18n 首屏翻译命中矩阵与回退策略

## 1. 概述

本文档记录项目中 i18n 翻译模块的加载链路、首屏关键路由的模块命中矩阵，以及翻译缺失时的回退策略。

**事实源**: 以本文档为准；核心实现在 `i18n/config/locale-modules.ts`、`i18n/config/locale-runtime-loader.ts` 与 `middleware/i18n-modules.global.ts`。

## 2. 加载链路

```
Nuxt i18n init (@boot)
  └── 加载 locale-registry.ts → NUXT_I18N_LOCALES
       └── files: getNuxtLocaleMessageFilePaths() → 仅核心模块

middleware/i18n-modules.global.ts (@every route)
  └── resolveLocaleMessageModulesForRoute(path)
       ├── 核心模块 (始终加载): common, components, public, settings, legal, auth
       └── 路由附加模块:
            ├── / → home
            ├── /login|register|forgot|reset → auth (冗余，已核心)
            ├── /admin/* → admin + admin-* (按 ADMIN_ROUTE_MODULE_RULES)
            ├── /installation → installation + admin + admin-settings
            └── demoMode → demo

各页面 <script setup> (按需补充)
  └── ensureLocaleMessageModules() → 显式加载特定模块（与中间件互补）
```

### 2.1 核心模块（构建时打包）

| 模块名 | 包含的 key 前缀 | 典型页面 |
|:---|:---|:---|
| `common` | `app.*`, `common.*`, `error.*`, `redirect.*` | 全局 |
| `components` | `components.*`, `comments.*` | 全局 |
| `public` | `pages.submit`, `pages.posts`, `pages.error`, `pages.user_agreement`, `pages.privacy_policy`, `pages.about`, `pages.links`, `pages.categories_index`, `pages.tags_index`, `pages.archives` | 关于、文章、分类、标签、友链、归档 |
| `settings` | `pages.settings` | 设置 |
| `legal` | `legal.*` | 法律页面 |
| `auth` | `pages.login`, `pages.register`, `pages.forgot_password`, `pages.reset_password` | 登录/注册 |

### 2.2 延迟模块（路由时按需加载）

| 模块名 | 触发路由 | 加载方式 |
|:---|:---|:---|
| `home` | `/` | 中间件自动 |
| `auth` | `/login`, `/register`, `/forgot-password`, `/reset-password` | 中间件自动 + 页面显式 await |
| `admin` | `/admin/**` | 中间件自动 |
| `admin-posts` | `/admin/posts/**` | 中间件自动 |
| `admin-calendar` | `/admin/calendar/**` | 中间件自动 |
| `admin-taxonomy` | `/admin/categories\|tags\|comments\|subscribers/**` | 中间件自动 |
| `admin-submissions` | `/admin/submissions/**` | 中间件自动 |
| `admin-ai` | `/admin/ai/**` | 中间件自动 |
| `admin-users` | `/admin/users/**` | 中间件自动 |
| `admin-ad` | `/admin/ad/**` | 中间件自动 |
| `admin-external-links` | `/admin/external-links/**` | 中间件自动 |
| `admin-link-governance` | `/admin/migrations/link-governance/**` | 中间件自动 |
| `admin-friend-links` | `/admin/friend-links/**` | 中间件自动 |
| `admin-marketing` | `/admin/posts/**`, `/admin/marketing/**` | 中间件自动 |
| `admin-notifications` | `/admin/notifications/**` | 中间件自动 |
| `admin-settings` | `/admin/settings/**`, `/installation/**` | 中间件自动 |
| `admin-email-templates` | `/admin/settings/**` | 中间件自动 |
| `admin-snippets` | `/admin/snippets/**` | 中间件自动 |
| `installation` | `/installation/**` | 中间件自动 |
| `demo` | 任意路由（demoMode=true） | 中间件自动 |

## 3. 首屏路由命中矩阵

| 路由 | 核心模块 | 额外模块 | 覆盖率 | 风险 |
|:---|:---|:---|:---|:---|
| `/` (首页) | 全部核心 | `home` | 100% | 无 |
| `/about` | 全部核心 | — | 100% | 无 |
| `/posts` | 全部核心 | — | 100% | 无 |
| `/posts/{slug}` | 全部核心 | — | 100% | 无 |
| `/categories` | 全部核心 | — | 100% | 无 |
| `/tags` | 全部核心 | — | 100% | 无 |
| `/archives` | 全部核心 | — | 100% | 无 |
| `/friend-links` | 全部核心 | — | 100% | 无 |
| `/benefits` | 全部核心 | — | 100% | ⚠️ `pages.enhanced_pack` 不在模块组定义中（实际在 `public.json`） |
| `/login` | 全部核心 | `auth`（冗余） | 100% | 无 |
| `/register` | 全部核心 | `auth`（冗余） | 100% | 无 |
| `/admin` | 全部核心 | `admin` | 100% | 无 |
| `/admin/posts` | 全部核心 | `admin` + `admin-posts` + `admin-marketing` | 100% | ⚠️ 页面使用 `void` 非阻塞加载 |
| `/admin/posts/{id}` | 全部核心 | `admin` + `admin-posts` + `admin-marketing` | 100% | 同上 |
| `/admin/calendar` | 全部核心 | `admin` + `admin-calendar` | 100% | 无 |
| `/admin/settings` | 全部核心 | `admin` + `admin-settings` + `admin-email-templates` | 100% | 无 |
| `/installation` | 全部核心 | `installation` + `admin` + `admin-settings` | 100% | 无 |
| `/search` | 全部核心 | — | 100% | 无 |

## 4. 回退策略

### 4.1 翻译缺失时的行为

```
请求翻译 key → $t('some.key')
  ├── 当前语言的模块已加载？
  │     ├── 是 → 返回译文
  │     └── 否 → 检查 fallbackChain
  │           ├── fallback 1 已加载？→ 返回 fallback 译文
  │           ├── fallback 2 已加载？→ 返回 fallback 译文
  │           └── 全部 fallback 未命中 → 返回原始 key
  └── （模块加载未完成）→ 返回原始 key（raw key leak）
```

### 4.2 fallbackChain 配置

| 语言 | fallback 链路 | 兜底 |
|:---|:---|:---|
| zh-CN | `zh-CN` | — |
| zh-TW | `zh-TW → zh-CN → en-US` | zh-CN |
| en-US | `en-US → zh-CN` | zh-CN |
| ko-KR | `ko-KR → en-US → zh-CN` | zh-CN |
| ja-JP | `ja-JP → en-US → zh-CN` | zh-CN |

### 4.3 运行时加载失败处理

- 如果 `loadLocaleModule()` 返回 `null`（文件不存在），模块静默跳过，使用 fallbackChain
- 如果动态 import 失败（网络错误），当前路由的未加载模块保持 raw key 状态
- `locale-runtime-loader.ts` 使用 WeakMap 缓存已加载模块，i18n 实例销毁后自动释放

## 5. 已知问题与治理

### 5.1 `pages.enhanced_pack` 模块组缺失

**状态**: 低风险（已通过核心模块 `public` 覆盖）  
**影响**: `pages/benefits.vue` 使用的 `pages.enhanced_pack.*` key 实际落在 `public.json` 中，加载无影响  
**建议**: 后续在 `public` 模块组中显式添加 `pages.enhanced_pack` 声明

### 5.2 `void` 非阻塞加载模式

**状态**: 已修复（本阶段）  
**影响文件**: `pages/admin/posts/index.vue`, `pages/admin/posts/[id].vue`  
**修复**: `void ensureLocaleMessageModules(...)` → `await ensureLocaleMessageModules(...)`  
**原因**: 虽然中间件已覆盖相同模块，但 `void` 丢失了语言切换时的竞态保护

## 6. 相关文档

- [测试规范](../../standards/testing.md) — i18n 测试要求
- [API 测试分层规则](./api-test-layering.md) — 测试分层规则
- [locale-registry.ts](../../../i18n/config/locale-registry.ts) — 语言注册表事实源
- [locale-modules.ts](../../../i18n/config/locale-modules.ts) — 模块分组定义
