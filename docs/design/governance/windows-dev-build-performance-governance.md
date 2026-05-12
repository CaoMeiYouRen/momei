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
- 进一步把忽略目录迁移到 Nuxt 顶层 `ignore` 并叠加 `packages/cli/**`、`packages/mcp-server/**` 等 Windows-local-dev 定向忽略后，`fs.watch` probe 的 `totalWatchRegistrations` 已从约 `2984` 收缩到约 `1060`，证明 watcher 噪声目录显著下降，但首请求仍未恢复。
- 在“首轮构建完成后再发第二次请求”的独立 profile 中，热点转为 Vite `matchPatterns -> _isIgnored -> _addToNodeFs`；对比二次请求前后的 watcher 快照，新增 watcher 主要集中在 `server/api`、`i18n/locales`、`server/utils`、`components/admin`、`pages/admin` 等真实业务树，而不是 `.github` / `docs` / `artifacts` 这类外围目录。
- 但把 `vite.server.watch` 直接设为 `null` 后，首个 `/api/settings/public` 请求在 `60s` 内仍然超时，而终端已在约 `33s` 左右打印 `Vite client built` / `Vite server built`。这说明 Vite watcher 动态扩张已不是主控制点。
- 同一轮试验里，终端曾出现 `Nuxt Nitro server built in 333417ms`。配合 `artifacts/dev-first-request-watch-null-60s.cpuprofile` 可见，`60s` 窗口主要消耗已经转移到 Rollup / `@rollup/plugin-node-resolve`、`exsolve`、`internalModuleStat`、`readPackageJSON`、`compileFunctionForCJSLoader` 等 Nitro dev 构建链，而不是单纯的 Vite watcher。
- 进一步用 `NUXT_ENABLE_NITRO_RESOLVE_PROBE=true` 对 `/api/settings/public` 跑 `180s` 长窗口后，增强版 `artifacts/nitro-resolve-probe.json` 在 repo-local bucket 视角下已经能说明主导方向：`topImporterBuckets` 中 `server/api` 约 `1439`、`server/api/admin` 约 `1248`、`server/services` 约 `928`、`server/utils` 约 `898`、`server/services/ai` 约 `464`、`server/api/ai` 约 `358`；与之对照，`i18n/locales` 在 repo-local 视角下只在 `topTargetBuckets` 中约为 `10`。由于同一份 probe 的全量结果仍会被 `node_modules` 与 `other` 这类 bucket 覆盖，因此这里更适合作为“repo-local 热点分布”证据，而不是全量 specifier 的绝对排序结论；但它已经足够说明首请求长尾并不是由 locale 资源树主导，而是被大范围 server graph 提前卷入。
- 同一份 probe 的 `topTargetBuckets` 在 repo-local 视角下主要落点是 `server/utils`（约 `1370`）、`utils/shared`（约 `1293`）、`server/entities`（约 `565`）、`server/services`（约 `415`）和 `server/database`（约 `293`）；`i18n/locales` 目标命中量仍只有约 `10`。结合 `focusBucketPairs` 这个专门过滤 repo-local 入口图的视角，可见主要热点集中在 `server/api -> server/utils`（约 `370`）、`server/api -> server/database`（约 `96`）、`server/api/admin -> server/utils`（约 `306`）、`server/api/admin -> server/database`（约 `38`）、`server/services -> server/utils`（约 `100`）、`server/services -> server/database`（约 `54`）、`server/api/ai -> server/utils`（约 `88`）、`server/api/ai -> server/services/ai`（约 `29`）、`server/services/ai -> server/utils`（约 `68`）和 `server/services/ai -> server/database`（约 `22`）。因此，当前最可信的 repo-local 结论是：Nitro resolve 长尾主要来自“广泛 `server/api` / `server/api/admin` 先扫进 `server/utils` / `server/database` / `utils/shared` / `server/entities`”这类公共依赖扇出，而不是单个 API 入口或 locale 模块。
- `artifacts/nitro-resolve-probe.snapshot.json` 中还能看到 `/api/settings/public` 相关链路反复命中 `types/setting`、`server/utils/api-runtime-cache`、`server/services/setting` 与 `server/utils/settings`。这说明当前公共设置读取路径并没有保持在轻量 public graph 内，而是共享了较宽的 settings / cache / service 栈。
- Windows 上读取 probe artifact 时曾触发 `EBUSY` 并打断 dev 进程，因此当前 probe 已改为“写盘忙则记录 marker 并重试”，并通过临时文件 + `rename` 替换正式 artifact，避免并发写把 `nitro-resolve-probe.json` 直接写坏；需要注意的是，运行中的诊断窗口里仍可能暂时只有 `.tmp` 或尚未生成正式 JSON，因此后续分析应优先基于已经复制出的 snapshot 或已落盘完成的正式 artifact，而不是把“文件暂时不存在”的窗口误判为没有采样结果。

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

截至 2026-05-12 最新一轮验证，这个判断还需要再收紧一层：

- `nuxt.options.ignore` 与 Windows-local-dev watcher ignore 只解决了外围目录噪声，不足以恢复首请求。
- `vite.server.watch = null` 依旧无法让首个公共 API 请求在 `60s` 内返回，因此“Vite watcher 本身”已经被证伪为主阻塞。
- 当前最强证据指向 Nitro dev 首次服务端构建：Vite client/server 可在约 `30s` 内完成，但公共请求仍被挂住；长窗口 CPU profile 已转向 Rollup / node-resolve / `exsolve` / Node 模块解析链。
- 新增 Nitro resolve bucket probe 后，可以把“哪条 repo-local graph 更重”进一步说清：当前不是 `i18n/locales`、不是单个 `/api/settings/public` handler 本身，而是 Nitro 在首请求期间将大范围 `server/api` / `server/api/admin` 入口一并扇出到 `server/utils`、`server/database`、`utils/shared`、`server/entities` 和部分 `server/services`。`server/api/ai` 与 `server/services/ai` 也是可见热点，但量级仍低于通用 `server/api -> server/utils` / `server/database` 扇出。
- 因为 `/api/settings/public` 明确命中 `types/setting`、`server/utils/api-runtime-cache`、`server/services/setting` 和 `server/utils/settings`，下一轮不应再把它当成“天然轻量的公共读接口”；更合理的方向是把 public settings 读链从通用 settings/service/cache 栈中切出来，避免首请求一上来就拖进完整 settings graph。
- 截至 2026-05-12 本轮继续验证后，以下几类“就近止血”仍未让 `pnpm perf:nuxt:dev -- --repeat=1` 恢复首请求：
   - 将 `/api/settings/public` 切成轻量 public read model。
   - Windows-local-dev 默认排除 admin pages / components / `server/api/admin`，仅保留 `NUXT_ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV=true` 的显式恢复开关。
   - 收紧 `nitro.externals.inline`，在 Windows 本地不再强制 inline `dayjs` / `lodash`。
   - 把 [app.vue](../../../app.vue) 的 `fetchTheme()` / `fetchSiteConfig()` 以及 [pages/index.vue](../../../pages/index.vue) 的 latest posts 改成 Windows-local-dev 客户端延后拉取。
- 这组结果说明：当前主阻塞仍然早于这些入口业务链和首页 SSR 数据链；后续不应继续把首页首屏或单个 public API 当作主控制点，而应继续收敛 Nitro dev 首次服务端构建本身。

因此，安装态中间件拆分仍是必要止血，但已经不再是当前首请求挂起的主控制点；下一轮应把主诊断重心放在 Nitro dev build 的依赖解析与服务端图规模，而不是继续微调 Vite watcher ignore。

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

截至 2026-05-12 本轮单样本复测，build 侧已经拿到一个可复用的止血点：

- 在 [nuxt.config.ts](../../../nuxt.config.ts) 中把 Windows 本地 `sourcemap.server` 关闭后，`pnpm perf:nuxt:build -- --repeat=1` 已从约 `542774ms` 降到 `490844ms`，首次进入 `<= 500s` 区间。
- 同一轮结果里，`Nuxt banner -> Server built` 约 `111s`，`Server built -> process exit` 约 `380s`，说明长尾仍在，但已经较上一轮约 `421s` 有所收敛。
- `rg -n "\\.map" artifacts/nuxt-build-performance.log` 已查不到 `.output/server/*.map` 写出记录，这与“关闭 server sourcemap 后尾部写盘负担下降”的判断一致。

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
- 2026-05-12 已有 `repeat=1` 单样本达到 `490844ms`；下一步需要补 `repeat=3`，确认该结果不是偶然波动。
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
   - 优先围绕 Nitro dev 首次构建链补更贴近根因的证据：Rollup / node-resolve / `exsolve`、Node 模块解析与服务端依赖图规模，而不是继续扩大业务层探针。
   - `nuxt.options.ignore`、工作区包 ignore 与 Vite watcher ignore 已验证只能降噪，不能单独恢复首请求；后续不应再把 watcher ignore 视为主修复方向。
   - 下一轮应优先围绕 `server/api -> server/utils`、`server/api/admin -> server/utils`、`server/api -> server/database` 这几条最重 pair 收缩入口图，而不是继续泛化到所有目录。
   - `/api/settings/public` 应先单独拆它的 settings graph：重点核查 `server/utils/api-runtime-cache`、`server/services/setting`、`server/utils/settings` 与 `types/setting` 是否能切出更轻量的 public read model，避免首请求加载完整 settings / admin 相关依赖。
   - `server/api/admin` 与 `server/api/ai` 的共享依赖扇出已经可见，应继续核查通用 `server/utils/permission`、`server/database`、实体聚合与 shared util 是否在 dev 首构建时被过早全量卷入；需要时再补更细的 Rollup resolve/load 热点与服务端 chunk 图。

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
