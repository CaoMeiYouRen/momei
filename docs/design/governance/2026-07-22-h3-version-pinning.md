# h3 版本锁定（v1.x）决策记录

- **日期**: 2026-07-22
- **状态**: 已实施
- **影响范围**: `package.json` 中显式声明 `"h3": "^1.15.11"`，并在 `dependabot.yml` 中忽略 `>=2.0.0-0`

## 背景

Nuxt 4 内部使用 `h3` v1.x（当前为 1.15.11），但 `h3` v2 RC 已出现在依赖树中：

| 包 | 依赖的 h3 版本 | 角色 |
|---|---|---|
| `@nuxt/nitro-server` | `h3@1.15.11` | Nuxt 内部 Nitro 运行时 |
| `devframe` → `@eslint/config-inspector` | `h3@2.0.1-rc.22` | ESLint Config Inspector UI |
| `@nuxt/test-utils` → `h3-next` | `h3@2.0.1-rc.25` | Nuxt 测试工具 |

## 问题

`h3` 不是 `momei` 的直接依赖。pnpm 在安装依赖时，可能将 `devframe` 的 `h3@2.0.1-rc.22` 作为 hoist 版本，使 `h3` 包解析到 v2 RC。

Nitro dev server 生成的 `.nuxt/dev/sentry.server.config.mjs` 中，auto-import 的 h3 函数按全局 h3 解析路径生成 import 语句。当 h3 解析到 v2 RC 时：

1. `getRequestIP(event)` 内部调用 `event.req.headers.get("x-forwarded-for")`
2. `getRequestHeader(event, name)` 内部调用 `event.req.headers.get(name)`
3. `readRawBody(event)` 内部调用 `event.req.text()`
4. `getHeaders(event)` 内部调用 `Object.fromEntries(event.req.headers.entries())`

但这些函数在**运行时**接收的 `event` 是 h3 v1 的 `H3Event`，其 `event.req` 指向 `event.node.req`（Node.js `IncomingMessage`），`headers` 是普通对象（没有 `.get()`、`.entries()` 方法），导致 TypeError 崩溃。

## 决策

在 `package.json` 的 `dependencies` 中显式声明：

```json
"h3": "^1.15.11"
```

这样 pnpm 会将 `h3@1.15.11` 安装为直接依赖，全局 `h3` 解析始终指向 v1，避免被其他依赖的 v2 RC 污染。

## 为什么不升级到 Nuxt 5

Nuxt v5 会统一使用 h3 v2，届时此锁定的移除时机为 Nuxt 5 升级时。相关 issue：https://github.com/nuxt/nuxt/issues/34738（标记为 "not planned" for v4）。

## 解除条件

- 升级到 Nuxt v5（正式版），确认 h3 已统一为 v2
- 或 Nuxt 4.x 官方发布 h3 v2 兼容性修复
- 届时移除 `package.json` 中的 h3 锁定和 `dependabot.yml` 中的忽略规则

## 验证

`tests/server/integration/h3-compat.test.ts` 中的测试用例验证：

1. `toWebRequest` 等 h3 v1 导出函数存在（v2 RC 已重命名为 `toRequest`）
2. `getRequestHeader` 能正确处理 h3 v1 事件（普通对象 headers）
3. `getRequestIP` 能正确处理 h3 v1 事件
4. `readRawBody` 能正确处理 h3 v1 事件
5. 这些函数在使用 `createEvent`（h3 v1）创建的事件上不抛出 `TypeError`

## 相关链接

- [Nuxt Issue #34738: Nuxt 4.4.2 dev server breaks toWebRequest](https://github.com/nuxt/nuxt/issues/34738)
- [h3 v2 迁移（未发布正式版）](https://github.com/unjs/h3)
