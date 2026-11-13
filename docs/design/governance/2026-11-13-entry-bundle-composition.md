# 入口包体构成与首屏 JS 收敛（2026-11-13）

## 口径

- `coreEntryJs`：Nuxt 客户端 manifest 的 `entrypoints` 模块 + `dependencies[entry].preload` 中的 JS 去重后 gzip（level 9）。
- `maxAsyncChunkJs`：排除 admin 路由 / 共享 runtime 后的最大异步 chunk。
- 模块分桶：`nuxi analyze`（rollup-plugin-visualizer）对入口 chunk 的模块级 gzip 估计，用于排序而非与 chunk 字节逐项相加。

## 收敛结果

| 指标 | 收敛前 | 收敛后 | 变化 |
|:---|:---|:---|:---|
| `coreEntryJs` | 331,190 B（323.43KB） | **287,359 B（280.62KB）** | −43,831 B（−13.3%） |
| 配额余量 | 11,850 B（3.45%） | **55,681 B（16.2%）** | 达到 ≥8% 目标 |
| `maxAsyncChunkJs` | 56,916 B | 95,021 B（Sentry + Replay 异步） | 仍 < 130KB 配额 |
| `keyCss` | 60,493 B | 60,493 B | 不变 |

改动：删除 `sentry.client.config.ts` 的入口期初始化，改为 `plugins/sentry.client.ts` 在插件内动态 `import('@sentry/nuxt')`，并自行订阅 Vue / Nuxt 错误钩子。入口不再静态引入 `@sentry/nuxt` 模块插件（原入口 `preload` 中的 Sentry chunk 约 40.8KB gzip 随之移除）；Sentry 客户端改为插件内动态导入，Vue / Nuxt 错误钩子由插件自行订阅并缓冲初始化前错误。Tracing（`routeLabel: path`）与 Replay 采样率保持原值，异步侧 Sentry + Replay 合并 chunk 为 95,021 B。

## 入口 Top 消费方（模块级 gzip 估计）

| 模块 | gzip |
|:---|:---|
| `reka-ui` | 94.4KB |
| `nuxt`（app/runtime 壳） | 48.8KB |
| `@vue/runtime-core` | 41.0KB |
| `caomei-ui` | 36.4KB |
| `@nuxtjs/i18n` | 21.7KB |
| `better-auth`（客户端） | 21.0KB |
| `@lucide/vue` | 19.2KB |
| `vue-router` | 15.5KB |
| `@vue/runtime-dom` | 15.1KB |
| `dayjs` | 13.1KB |
| `unhead` | 12.2KB |
| `@vueuse/core` | 8.9KB |
| `@intlify/core-base` | 8.6KB |
| `vue-i18n` | 7.8KB |
| `@intlify/message-compiler` | 7.2KB |
| `@floating-ui/{dom,core}` | 9.0KB |
| `@better-fetch/fetch` | 6.2KB |

入口最大单 chunk 51.7KB（应用入口），其次 50.4KB（Vue runtime）；Sentry 已退出入口 chunk 列表。

## 后续候选（未在本批执行）

- `reka-ui` 为 caomei-ui 的底层依赖，需上游按组件裁剪或按需注册；
- `@nuxtjs/i18n` + `@intlify/*` 合计约 45KB，评估非当前语言消息按路由/语言动态加载；
- `better-auth` 客户端 21KB，评估仅认证路由加载；
- `@lucide/vue` 19.2KB，已按需导入，进一步收敛需拆分全局壳图标。

## 验证

- `pnpm test:perf:budget:strict`：Pass（coreEntry 287,359 / 343,040；maxAsync 95,021 / 133,120；keyCss 60,493 / 63,488）。
- `pnpm typecheck`、`pnpm lint` 通过；`pnpm build` 成功。
- 复采命令：`nuxi analyze --no-open`（生成本报告数据）；`pnpm test:perf:budget:strict`（门禁口径）。
