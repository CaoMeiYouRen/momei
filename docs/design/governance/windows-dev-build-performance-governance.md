# Windows 本地 Dev / Build 性能治理 (Windows Local Dev / Build Performance Governance)

## 1. 概述

本文档聚焦 Windows 本地开发体验的两类问题：

- `nuxt dev` 虽然已经不再出现“明显卡死”，但首个请求仍存在长时间无响应。
- `nuxt build` 已恢复可完成，但总耗时仍远高于可接受区间。

本专项只覆盖本地 Windows 开发 / 构建生命周期，不替代既有的前端页面性能预算、Lighthouse 或 bundle budget 守线。

## 1.1 当前计划边界

本轮仅做一次方案与规划收敛，不直接开始运行时代码改造。当前文档的职责是把执行顺序、量化目标与验收口径固定下来，避免后续又回到“边改边定义目标”。

## 2. 已落地修复

当前仓库已经完成一轮 Windows 兼容止血，事实源在 [nuxt.config.ts](../../../nuxt.config.ts)：

- Windows 下将 Nitro `externals.trace` 关闭，避免本地依赖追踪过重。
- Nitro inline 依赖收窄到邮件 / HTML 渲染链，不再把 PrimeVue 等前端依赖强行并入服务端构建。
- Windows 本地默认关闭 `@vite-pwa/nuxt`，保留 `NUXT_ENABLE_PWA_ON_WINDOWS=true` 的显式开关，绕开当前 Rolldown / `manualChunks` 兼容性与额外构建负担。

这些改动已经把“构建卡住”收敛为“构建可完成但仍偏慢”。

## 3. 当前基线

### 3.1 测量入口

当前统一通过 [scripts/perf/measure-nuxt-lifecycle.mjs](../../../scripts/perf/measure-nuxt-lifecycle.mjs) 采集本地生命周期时间，并通过 `package.json` 暴露以下稳定入口：

- `pnpm perf:nuxt:dev`
- `pnpm perf:nuxt:build`
- `pnpm perf:nuxt:baseline`

输出默认落在：

- `artifacts/nuxt-dev-performance.json`
- `artifacts/nuxt-dev-performance.log`
- `artifacts/nuxt-build-performance.json`
- `artifacts/nuxt-build-performance.log`

若需要验证公共 API 首请求，可直接运行：

```bash
node scripts/perf/measure-nuxt-lifecycle.mjs --mode=dev --request-path=/api/settings/public --output=artifacts/nuxt-dev-api-performance.json --log-output=artifacts/nuxt-dev-api-performance.log
```

### 3.2 2026-05-11 Windows 本地实测

| 场景 | 命令 | 当前结果 | 结论 |
| :--- | :--- | :--- | :--- |
| 首页首请求 | `pnpm perf:nuxt:dev` | `Local` 输出约 `8.09s`，但 `/` 首请求 `60s` 内未拿到响应头 | 端口监听已出现，但首个页面请求仍被全局冷路径阻塞 |
| 公共 API 首请求 | `measure-nuxt-lifecycle --mode=dev --request-path=/api/settings/public` | `Local` 输出约 `26.11s`，但 `/api/settings/public` 首请求同样 `60s` 超时 | 问题不在页面模板自身，而在请求级全局初始化 |
| 本地生产构建 | `pnpm perf:nuxt:build` | 总耗时约 `542.77s`；`Client built` 约 `26.36s`；`Server built` 约 `28.01s`；`Server built` 里程碑出现于约 `121.14s` | 主要耗时不在 Vite bundling，而在 `Server built` 之后约 `421.63s` 的 Nitro / 产物收尾阶段 |

补充事实：`artifacts/nuxt-build-performance.log` 尾部显示 `.output/server/**/*` 大量产物写出，最终 `Σ Total size` 约为 `21.9 MB (3.53 MB gzip)`，进一步支持“构建尾耗时由 Nitro / 服务端产物阶段主导”的判断。

### 3.3 2026-05-12 补充诊断

- 直接请求 `/`、`/api/settings/public` 与 `/favicon.ico` 时，TCP 连接都能建立，但 `15s` 到 `20s` 内始终 `0 bytes received`。
- 已在 [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts) 和 [server/api/settings/public.get.ts](../../../server/api/settings/public.get.ts) 顶部增加 `console.info` 级别的进入探针；在上述超时窗口内，这两条 marker 都没有出现。
- 这说明当前 Windows 本地 dev 的首请求阻塞点早于 H3 middleware / API handler，不能再把主因归结为安装态中间件或页面 SSR 顶层初始化。
- 基于 `node --cpu-prof` 抓取的 `artifacts/CPU.20260512.000620.159640.0.001.cpuprofile`，热点主要落在 Node ESM 解析、`exsolve`、Nuxt `initNuxt -> resolveTypescriptPaths` 与 Nitro / `archiver` 链路，而不是用户态 handler。
- Windows 本地 dev 侧已经追加了若干范围受限的收紧措施：默认关闭 `@nuxt/eslint`、`@sentry/nuxt/module`、`@nuxtjs/sitemap`，关闭 `typescript.includeWorkspace`，并禁止强制 `vite.optimizeDeps.include` / `noDiscovery`。这些改动改变了启动路径，但仍未让 `/favicon.ico` 在 `15s` 内恢复响应。

### 3.4 对照目标口径

当前 Windows 本地 build 基线约为 `542.77s`，已经明显偏离可接受区间。结合本轮讨论，后续治理统一采用两级目标：

- 第一目标：先把 Windows 本地 `pnpm perf:nuxt:build -- --repeat=3` 的总耗时中位数压到 `<= 500s`，优先解决“明显偏离日常可用”的问题。
- 第二目标：在 `<= 500s` 达成后，继续向 Linux 侧约 `120s` 级别的参考体验靠近；该 `120s` 目前作为对照目标使用，不视为当前仓库已验证可直接达到的承诺值。

因此，后续所有优化讨论都应先回答“能否把 Windows 从 542s 级别压进 500s 内”，再讨论如何继续逼近 `120s` 档位，而不是一开始就把两种目标混为一谈。

## 4. 已确认热点

### 4.1 Dev 首请求阻塞

当前已经确认两件事：

- [server/middleware/0b-db-ready.ts](../../../server/middleware/0b-db-ready.ts) 仍会跳过 `/` 与 `/api/settings/public`。
- 在 `/`、`/api/settings/public` 与 `/favicon.ico` 的超时窗口中，[server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts) 与 [server/api/settings/public.get.ts](../../../server/api/settings/public.get.ts) 顶部新增的 `console.info` 进入探针都不会触发。

这意味着当前 Windows 本地 dev 的问题已经从“请求进入应用层后被某条业务冷路径阻塞”收敛为“请求尚未进入 H3 应用层就被 Nuxt/Vite/Nitro 的前置准备阶段卡住”。

最新 CPU profile 进一步支持这一点：

- 热点集中在 Node ESM 解析、`realpathSync` / `lstat`、`exsolve`、Nuxt `resolveTypescriptPaths()`、Nitro / `archiver` 链路。
- `@nuxtjs/i18n`、`@nuxtjs/sitemap`、`@sentry/nuxt`、`@nuxt/eslint` 等模块都出现在启动期样本里，但没有任何单一可选模块探针能独立恢复首请求。
- 杀掉长时间挂起的 dev 进程后，终端曾补吐出 `Vite client built`、`Vite server built` 与 `optimizer scanning/bundling dependencies` 日志，说明首请求阻塞期间至少存在 Vite 预构建或相关准备工作延后执行的迹象。

因此，安装态中间件拆分仍是必要止血，但已经不再是当前首请求挂起的主控制点。

### 4.2 Build 尾耗时过长

`pnpm perf:nuxt:build` 的结果表明：

- `Nuxt banner -> Client built` 约 `93s`
- `Nuxt banner -> Server built` 约 `121s`
- `Server built -> Build complete` 仍有约 `421s`

因此当前 Windows 本地构建的主要瓶颈不是单纯的 Vite client/server bundle，而是：

- Nitro 产物整理与 `.output/server` 大规模写出
- 服务端 chunk / sourcemap 数量膨胀带来的本地文件系统开销
- 可能的 Nitro post-build 收尾逻辑

这一段需要继续定量拆解，而不是只看 `Client built` / `Server built` 两行日志。

## 5. 治理目标

### 5.1 P0：恢复可接受的首请求体验

目标：Windows 本地 `nuxt dev` 不能只做到“端口可见”，而必须做到“首个公共请求可响应”。

建议验收：

- `pnpm perf:nuxt:dev -- --repeat=3` 的首页首请求中位数 `<= 15s`
- `--request-path=/api/settings/public` 的首请求中位数 `<= 15s`
- 不再出现 `warmRequest timed out after 60000ms`

### 5.2 P1：压缩构建尾耗时

目标：先把 Windows 本地构建的“Server built 之后长尾”单独收敛，而不是笼统宣称“继续优化 build”。

建议验收：

- 第一阶段先把 `pnpm perf:nuxt:build -- --repeat=3` 的总耗时中位数压到 `<= 500s`
- 在第一阶段稳定后，再继续把总耗时中位数向 `120s` 参考档位逼近；只有当热点拆解结果支持时，才把这一目标升格为正式承诺
- `Server built -> Build complete` 尾耗时需要先显著低于当前约 `421s` 的长尾水平，并在后续剖析后补成更细的阶段验收阈值
- 不以破坏 `pnpm build` 正常产物或质量门为代价

### 5.3 P2：固定量化口径

目标：避免后续又回到“体感变快 / 体感变慢”的描述。

建议验收：

- 继续复用 [scripts/perf/measure-nuxt-lifecycle.mjs](../../../scripts/perf/measure-nuxt-lifecycle.mjs) 作为唯一生命周期计时脚本
- 所有阶段性结论至少附带 JSON artifact 或等价日志
- Windows 本地 Dev / Build 治理继续保留在 backlog 长期主线，直到基线稳定后再考虑关闭

## 6. 下一轮切片建议

1. 先完成安装状态探测方案冻结。
   - 已落地的 connection-only 拆分应继续保留，但不再把它视为当前 dev 首请求阻塞的唯一主因。
   - 本步后续只保留“避免额外放大安装态冷路径”的目标，不再承载 Nuxt dev 无响应的主诊断任务。

2. 把排查主线切到 Nuxt / Vite / Nitro 的请求前准备阶段。
   - 优先围绕 `resolveTypescriptPaths()`、Node ESM 解析、Vite optimizer 及 Nitro 初始化补更贴近根因的诊断证据，而不是继续扩大业务层探针。
   - 下一轮应优先产出“请求前阶段”的稳定证据，例如更细的 CPU profile 摘要、Vite optimizer 生命周期日志，或能明确区分“预构建未完成”和“全局 ready 锁未释放”的诊断输出。

3. 再进入 build 长尾专项剖析。
   - 在 `perf:nuxt:build` 现有结果基础上，继续统计 `serverBuilt -> process exit` 长尾，并补 `.output/server` chunk 数量、sourcemap 数量、最大服务端 chunk 与总文件写出规模。
   - 这一轮的首要收益目标不是立刻追到 `120s`，而是先为“压进 `500s` 内”提供可执行的热点清单。

4. 保持 Windows 定向优化边界。
   - PWA、Nitro trace、inline 包，以及本轮新增的 Windows-local-dev 模块 / TypeScript / Vite 门禁，都应继续限定在“本地 Windows 优化”范围内，不把这轮专项扩写成全平台构建重构。

## 7. 非目标

- 不在本专项内重写整套安装流程或数据库抽象层。
- 不新起第二套前端性能预算体系；页面体积与 Lighthouse 继续由既有性能规范负责。
- 不把本轮治理扩大为“全仓所有构建慢点一次性清零”。

## 8. 相关文件

- [nuxt.config.ts](../../../nuxt.config.ts)
- [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts)
- [server/middleware/0b-db-ready.ts](../../../server/middleware/0b-db-ready.ts)
- [server/database/index.ts](../../../server/database/index.ts)
- [scripts/perf/measure-nuxt-lifecycle.mjs](../../../scripts/perf/measure-nuxt-lifecycle.mjs)
- [docs/plan/backlog.md](../../plan/backlog.md)
