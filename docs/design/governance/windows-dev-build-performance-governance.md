# Windows 本地 Dev / Build 性能治理 (Windows Local Dev / Build Performance Governance)

## 1. 概述

本文档聚焦 Windows 本地开发体验的两类问题：

- `nuxt dev` 虽然已经不再出现"明显卡死"，但首个请求仍存在长时间无响应。
- `nuxt build` 已恢复可完成，但总耗时仍远高于可接受区间。

本专项只覆盖本地 Windows 开发 / 构建生命周期，不替代既有的前端页面性能预算、Lighthouse 或 bundle budget 守线。

### 1.2 行业背景与外部调研

Windows 下 Nuxt/Vite 构建慢是行业共性问题，并非本项目特有：

- **Node.js 在 NTFS 上的先天劣势**：Windows 文件系统处理大量小文件的开销显著高于 Linux（ext4/XFS），这直接影响 Vite 的模块扫描、Nitro 的依赖解析和文件监控。[Reddit 社区讨论](https://www.reddit.com/r/Nuxt/comments/1cytzp0/why_is_nuxt_so_slow_on_windows/) 中实测同项目 Windows 启动约 40s+，macOS M2 约 10s。[Nuxt #20596](https://github.com/nuxt/nuxt/issues/20596) 被标记为 Windows-specific bug。
- **WSL2 是社区公认的 top-1 解决路径**：Reddit、StackOverflow、Vite 官方文档均推荐将项目放在 WSL2 的 Linux 文件系统内（非 `/mnt/c/`），可恢复接近 Linux 原生性能。但 WSL2 在企业环境或低配机器上并非总是可用。
- **Nuxt 缺少构建缓存**：[Nuxt #23392](https://github.com/nuxt/nuxt/issues/23392) 指出即便代码未变更，重复 `nuxt build` 耗时不减（vs Next.js 的缓存可将二次构建减半）。CI 场景下每次增量构建都需全量代价。
- **Dev Server 启动时间随项目规模线性增长**：[Nuxt #27106](https://github.com/nuxt/nuxt/issues/27106) 提供了详细的拆解数据：900 文件项目约 27s 启动，其中模块/插件/CSS/TypeScript 各分摊数秒，不存在单一罪魁祸首。
- **Vite build 可能挂起（hangs）**：常见原因包括 `build.watch: true`、插件生成大量 CSS 规则、i18n 配置错误、或 `@nabla/vite-plugin-eslint` 等检查插件在构建阶段引入长尾。[StackOverflow 讨论](https://stackoverflow.com/questions/75839993/vite-build-hangs-forever)
- **Vite Performance Guide** 提供跨平台通用的优化建议：[官方文档](https://vite.dev/guide/performance) 建议审核插件 hooks、减少 resolve 路径猜测、避免 barrel files、使用 `server.warmup`、减少非原生工具链。

以上外部调研的完整报告见：[research-output/nuxt-windows-build-slow-2026-06-04.md](../../../research-output/nuxt-windows-build-slow-2026-06-04.md)。

## 1.1 当前计划边界

当前已经进入“最小止血 + 基线量化 + 受控验证”阶段，不再停留于纯规划收敛。当前文档的职责除了固定执行顺序、量化目标与验收口径外，也同步沉淀已验证有效的止血点、已证伪的方向，以及下一轮应继续追踪的控制面。

## 2. 已落地修复

当前仓库已经完成一轮 Windows 兼容止血，事实源在 [nuxt.config.ts](../../../nuxt.config.ts)：

- Windows 下将 Nitro `externals.trace` 关闭，避免本地依赖追踪过重。
- Nitro inline 依赖收窄到邮件 / HTML 渲染链，不再把 PrimeVue 等前端依赖强行并入服务端构建。
- Windows 本地默认关闭 `@vite-pwa/nuxt`，保留 `NUXT_ENABLE_PWA_ON_WINDOWS=true` 的显式开关，绕开当前 Rolldown / `manualChunks` 兼容性与额外构建负担。

这些改动已经把“构建卡住”收敛为“构建可完成但仍偏慢”。

- Windows 下的 dev 生命周期量化脚本现已直接调用 repo-local [node_modules/nuxt/bin/nuxt.mjs](../../../node_modules/nuxt/bin/nuxt.mjs)，不再经由 `pnpm exec nuxt`；这一步不是性能优化本体，但修复了当前环境里 `nuxt` shim 缺失导致的假失败，使 `artifacts/nuxt-dev-performance.json` 重新具备可复跑性。
- 同一问题也已经同步收敛到 [package.json](../../../package.json) 的标准入口：`dev`、`build`、`generate`、`preview`、`postinstall` 与 `typecheck` 现统一直连 repo-local Nuxt CLI。最新 `pnpm run typecheck` 已在当前 Windows 环境完整跑通并返回 `EXITCODE=0`，说明“标准脚本入口本身起不来”这一层已被修复。
- [server/utils/rate-limit.ts](../../../server/utils/rate-limit.ts) 已把 `limiterStorage` 改为在 `rateLimit()` 内部懒加载，避免仅因常驻中间件模块被扫描，就在顶层提前拉入 `server/database/storage` 与 `ioredis` 存储链。
- [server/database/storage.ts](../../../server/database/storage.ts) 现已把底层 Redis / LRU 存储实例改为首次访问时再创建，而不是在模块导入时立刻实例化。这一步属于 always-loaded install/auth/logger/database cluster 的继续收窄，当前已通过 `pnpm run typecheck` 验证接口未回归，但性能收益仍需下一轮冷启动复测确认。
- [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts) 现在改为只调用轻量 [server/services/installation-probe.ts](../../../server/services/installation-probe.ts) 来读取 `installed` / `databaseConnected`，并把 logger 下沉到函数内按需导入；安装态探测边界已经冻结为“连接级初始化 + 状态探针”，不再复用携带环境诊断、设置聚合与安装向导写路径的重型 [server/services/installation.ts](../../../server/services/installation.ts)。
- [server/middleware/0b-db-ready.ts](../../../server/middleware/0b-db-ready.ts)、[server/middleware/1-auth.ts](../../../server/middleware/1-auth.ts)、[server/middleware/2-log.ts](../../../server/middleware/2-log.ts) 与 [server/utils/permission.ts](../../../server/utils/permission.ts) 已继续把 logger / auth / database 依赖改为函数内懒加载；其中 `permission.ts` 不再在模块顶层静态引入 [lib/auth.ts](../../../lib/auth.ts) 与 [server/database/index.ts](../../../server/database/index.ts)，避免 `requireAuth` / `requireAdmin` 被大范围 API 顶层导入时把整条鉴权与数据库链提前卷进 Nitro 首构建。
- 模块开关策略补充约束：`@nuxt/eslint` 不能通过 Windows 本地开关关闭。原因是 [eslint.config.js](../../../eslint.config.js) 需要 `import withNuxt from './.nuxt/eslint.config.mjs'`，关闭模块会让 lint 链路直接失效。自本轮起，`@nuxt/eslint` 固定启用。
- 对其余可选模块，统一要求“模块开关与配置项成对出现”。例如关闭 `@nuxtjs/sitemap` 时，必须同时移除/禁用 `nuxt.config.ts` 里的 `sitemap` 配置块，否则会在开发阶段触发 Nuxt 类型报错。

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

### 3.4 2026-05-13 Dev 基线补充

- 当前事实源已经确认：`scripts/perf/measure-nuxt-lifecycle.mjs` 在 Windows 上可以稳定拉起 `nuxt dev`，因此“测量脚本自己没把服务起起来”已经被证伪。
- 最新基线命令 `node scripts/perf/measure-nuxt-lifecycle.mjs --mode=dev --repeat=1 --request-path=/favicon.ico --warm-request-timeout-ms=60000` 的结果已落在 `artifacts/nuxt-dev-favicon-performance.json`：`Local ready` 约 `24419ms`，但 `/favicon.ico` 的首次请求在 `60000ms` 窗口内仍无响应，最终于约 `84422ms` 记录 `warmRequestFailed`。
- 为排除测量脚本干扰，另起一个独立 `nuxt dev` 进程并从外部直接请求 `http://127.0.0.1:34568/favicon.ico`；该请求同样在约 `60231ms` 后因 `HttpClient.Timeout` 超时失败。这说明当前问题不在量化脚本，而在 Nuxt / Nitro 自身于 `Local ready` 之后仍无法在 `60s` 内返回最小静态请求。
- 随后用独立 `nuxt dev` 进程加外部 `curl` 轮询重新测了一次真正的“启动到首个成功响应”基线，结果已落在 [artifacts/nuxt-dev-startup-baseline.json](../../../artifacts/nuxt-dev-startup-baseline.json) 与 [artifacts/dev-startup-baseline-34571.log](../../../artifacts/dev-startup-baseline-34571.log)：`/favicon.ico` 首个 `HTTP 200` 的 wall-clock 约为 `502279ms`，`curl` 自身等待约 `485.29s`，同一轮日志里记录 `Nuxt Nitro server built in 426190ms`。这说明当前 Windows 本地 dev 已经不是“起不来”，而是“首个成功响应约需 8.37 分钟”，可作为后续优化前的正式基线。
- 对已经完成 Nitro build 并 warmed 的独立 dev 进程再次请求 `/favicon.ico` 时，响应仅约 `203ms`。这进一步说明当前主要问题集中在首次服务端构建与首响冷路径，而不是服务进入 warmed 状态后的稳态响应。
- 在一轮 `NUXT_ENABLE_NITRO_RESOLVE_PROBE=true` 的 `60s` 窗口里，首次请求约在 `Local ready` 后 `31.4s` 才触发 `nitro-dev-build:build-before`，并在约 `32.5s` 后进入 `rollup-before`；直到超时都没有出现 `compiled`。这说明当前真正卡住的是 Nitro dev 首次服务端构建本身，而不是 Vite client/server 预热。
- 期间曾尝试把 Windows-local-dev 的大批 API / install / auth / middleware / plugin surface 一次性排除出默认扫描面，但该方向没有恢复首响，反而把 `Local ready` 拉长到约 `36.89s`。这组试探性 ignore 已回滚，不作为后续优化方向继续保留。
- 上一轮成功落盘的 `artifacts/nitro-resolve-probe.json` 虽然来自已回滚的 reduced-surface 试验，但它仍然提供了有效的根因收敛线索：在大范围 public API surface 被裁掉后，剩余热点集中到 `server/middleware/0-installation.ts`、`server/middleware/0b-db-ready.ts`、`server/middleware/1-auth.ts`、`server/utils/logger.ts`、`server/database`、`server/api/auth/[...all].ts` 与 `server/api/install/**`。因此，下一轮应继续围绕“always-loaded install/auth/logger/database cluster”而不是继续扩大 route ignore 试验。

### 3.5 2026-05-14 Dev 基线收敛

- 在继续收窄 always-loaded install/auth/logger/database cluster 后，最新命令 `pnpm perf:nuxt:dev -- --repeat=1 --request-path=/favicon.ico --warm-request-timeout-ms=120000` 的结果已覆盖到 [artifacts/nuxt-dev-favicon-performance.json](../../../artifacts/nuxt-dev-favicon-performance.json)：`Local ready` 约 `2729ms`，`Nuxt Nitro server built` 约 `44067ms`，`/favicon.ico` 首个 `HTTP 200` 约 `58549ms`，首个响应块约 `55821ms`。
- 相比 2026-05-13 外部直连基线中约 `502279ms` 的首个成功响应，本轮已把首响压缩约 `446s`，降幅约 `88.9%`；当前 Windows dev 的主问题已经从“`Local ready` 后长时间无响应”收敛成“首个请求会同步触发约 `44s` 的 Nitro 首次服务端构建”。
- 同日的 probe 口径结果已落在 [artifacts/nitro-resolve-probe.json](../../../artifacts/nitro-resolve-probe.json)。需要注意的是，启用 `NUXT_ENABLE_NITRO_RESOLVE_PROBE=true` 会把同一路径放大到约 `83s`，因此 probe 只用于拓扑分析，不作为正式性能基线。
- 最新 probe 的 `topSpecifiers` 显示，当前 repo-local 热点已经从单一 install/auth/logger cluster 转向更广的共享图：`server/database/index.ts`、`server/utils/permission.ts`、`types/setting.ts`、`utils/shared/roles.ts` 与 `server/utils/logger.ts` 仍位于前列；其中 logger 已降到约 `56` 次命中，不再是唯一主导项，而 `server/database` / `permission` / `types/setting` 这几条共享入口成为下一轮更直接的收敛对象。

### 3.6 2026-05-16 真实环境复核与 bisect 结论

- 用户在 Windows 本地真实 `pnpm run dev` 场景提供了可复现日志：`Nuxt Nitro server built in 91041ms`，随后首轮页面链路可响应，但出现运行时依赖发现与二次预构建提示（`Vite discovered new dependencies at runtime` / `New dependencies found`）。
- 同一轮日志还显示了两个需要并行关注的副信号：
   - `TaskScheduler` 在本地开发环境注册了周期任务并持续触发数据库扫描（每 `5` 分钟一次）。
   - `pg` 驱动出现 `client.query() when the client is already executing a query` 的 deprecation warning，说明当前连接复用路径存在并发查询告警面。
- 用户基于提交区间验证给出明确 bisect 事实：
   - good: `9cb0b9a5fb136ef56f5b445f7a1d73f864e9f7eb`
   - good: `28b9d7ef8647360eed8b8b2ab56c4b9adb83d4a3`
   - bad: `cca7493bb16c0765a459618d9dc79fe73773c33c`
- 在 `28b9d7e..cca7493b` 区间内，改动仅命中 [nuxt.config.ts](../../../nuxt.config.ts)。因此该次回归的首要入口应继续锚定 Nuxt 配置层（模块装配、Nitro external/inline、Windows 分支配置），而不是先扩散到业务 API 实现层。
- 2026-05-16 在当前仓库复跑 `pnpm perf:nuxt:dev -- --repeat=1 --request-path=/favicon.ico --warm-request-timeout-ms=120000`，结果为 `Nuxt Nitro server built` 约 `71.07s`、首请求响应头约 `90.62s`。该结果高于 2026-05-14 的约 `58.55s` 首响基线，说明后续提交存在回归或环境分支差异，需要继续沿 `nuxt.config.ts` 的后续提交做定向排查。
- 当日已执行一轮“配置层最小试探”并得到证伪结论：
   - 试探 1：在 Windows 本地临时恢复 Nitro inline（`lodash` / `lodash-es` / `dayjs`）以缩短外部解析链。
   - 试探 2：预填运行时提示的 Vite pre-bundle 依赖，尝试减少首次访问后的动态依赖发现。
   - 实测结果：`Nuxt Nitro server built` 从约 `71.07s` 升高到约 `93.99s`，`warmRequestHeaders` 从约 `90.62s` 升高到约 `111.73s`，属于明显退化。
   - 处置：上述试探已全部回退，不保留在当前配置中；后续排查不再继续“扩大 Nitro inline 包集合”这条路径。
- 2026-05-16 夜间再验证（`pnpm run dev` 真实访问链路）显示：
   - `Nuxt Nitro server built in 131254ms` 后，首页与 `settings/public`、`settings/theme`、`posts/home`、`friend-links` 等首屏依赖 API 已可稳定返回 `200`。
   - `TaskScheduler` 日志显示“`Skipping cron registration outside production.`”，说明开发环境周期任务门禁按预期生效。
   - 本轮结论：**“Windows 本地 dev 无法启动 / 无法访问首页”问题暂时关闭**；当前保留问题已收敛为“首轮 Nitro 构建仍偏慢（约 `131s`）”。
   - 后续动作：性能问题继续保留在本专项与 backlog 长期主线跟踪，不再阻塞当前可用性收口。

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
- 2026-05-13 的独立外部请求也验证了同一结论：即便不经过量化脚本，只要 `Local ready` 后直接请求 `/favicon.ico`，`60s` 内依旧不会返回任何响应头；因此“测量脚本或父进程 fetch 把请求拖挂”可以从候选根因里排除。

截至 2026-05-12 最新一轮验证，这个判断还需要再收紧一层：

- `nuxt.options.ignore` 与 Windows-local-dev watcher ignore 只解决了外围目录噪声，不足以恢复首请求。
- `vite.server.watch = null` 依旧无法让首个公共 API 请求在 `60s` 内返回，因此“Vite watcher 本身”已经被证伪为主阻塞。
- 当前最强证据指向 Nitro dev 首次服务端构建：Vite client/server 可在约 `30s` 内完成，但公共请求仍被挂住；长窗口 CPU profile 已转向 Rollup / node-resolve / `exsolve` / Node 模块解析链。
- 新增 Nitro resolve bucket probe 后，可以把“哪条 repo-local graph 更重”进一步说清：当前不是 `i18n/locales`、不是单个 `/api/settings/public` handler 本身，而是 Nitro 在首请求期间将大范围 `server/api` / `server/api/admin` 入口一并扇出到 `server/utils`、`server/database`、`utils/shared`、`server/entities` 和部分 `server/services`。`server/api/ai` 与 `server/services/ai` 也是可见热点，但量级仍低于通用 `server/api -> server/utils` / `server/database` 扇出。
- 因为 `/api/settings/public` 明确命中 `types/setting`、`server/utils/api-runtime-cache`、`server/services/setting` 和 `server/utils/settings`，下一轮不应再把它当成“天然轻量的公共读接口”；更合理的方向是把 public settings 读链从通用 settings/service/cache 栈中切出来，避免首请求一上来就拖进完整 settings graph。
- 截至 2026-05-13 本轮继续验证后，以下几类“就近止血”仍未让 `pnpm perf:nuxt:dev -- --repeat=1` 恢复首请求：
   - 将 `/api/settings/public` 切成轻量 public read model。
   - Windows-local-dev 默认排除 admin pages / components / `server/api/admin`，仅保留 `NUXT_ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV=true` 的显式恢复开关。
   - 收紧 `nitro.externals.inline`，在 Windows 本地不再强制 inline `dayjs` / `lodash`。
   - 把 [app.vue](../../../app.vue) 的 `fetchTheme()` / `fetchSiteConfig()` 以及 [pages/index.vue](../../../pages/index.vue) 的 latest posts 改成 Windows-local-dev 客户端延后拉取。
- 还包括一轮“更激进地裁掉 install/auth/middleware/plugin surface”的 reduced-surface ignore 试验；该方向不但没有恢复首响，还把 `Local ready` 拉长到约 `36.89s`，因此已被明确判定为低收益且不再继续。
- 这组结果说明：当前主阻塞仍然早于这些入口业务链和首页 SSR 数据链；后续不应继续把首页首屏或单个 public API 当作主控制点，而应继续收敛 Nitro dev 首次服务端构建本身。
- 2026-05-14 的最新结果表明，“always-loaded install/auth/logger/database cluster” 这一轮窄切片已经完成了有效止血：安装态探测、中间件 logger、可选 session 与 permission 顶层鉴权链不再是主要阻塞源。当前剩余长尾已经转移到更广义的 `server/api -> server/database / server/utils/permission / types/setting / utils/shared/roles` 共享图，因此后续不应再回到安装态或 logger 这一层做重复治理。

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
   - 围绕 `server/middleware/0-installation.ts`、`server/middleware/0b-db-ready.ts`、`server/middleware/1-auth.ts`、`server/utils/logger.ts`、`server/utils/permission.ts` 与 `server/database` 这组“无需页面命中也会被 Nitro 首构建提前扫描”的入口，当前已经完成一轮顶层 import 收紧，并把首响从约 `502279ms` 压到约 `55821ms`。下一轮不应重复停留在安装态或 logger 本身，而应直接转向 `server/database/index.ts`、`server/utils/permission.ts`、`types/setting.ts` 与更广泛的 `server/api` 共享图，继续缩短约 `44s` 的 Nitro 首次服务端构建。

3. 再进入 build 长尾专项剖析。
   - 在 `perf:nuxt:build` 现有结果基础上，继续统计 `serverBuilt -> process exit` 长尾，并补 `.output/server` chunk 数量、sourcemap 数量、最大服务端 chunk 与总文件写出规模。
   - 这一轮的首要收益目标不是立刻追到 `120s`，而是先为“压进 `500s` 内”提供可执行的热点清单。

4. 保持 Windows 定向优化边界。
   - PWA、Nitro trace、inline 包，以及本轮新增的 Windows-local-dev 模块 / TypeScript / Vite 门禁，都应继续限定在“本地 Windows 优化”范围内，不把这轮专项扩写成全平台构建重构。
   - 已证伪的 broad ignore / reduced-surface 试验不再继续保留为默认配置；后续只接受“能证明首响缩短且不把 Local ready 拉长”的更窄修复。

## 7. 2026-06-05 Phase 43 Vite 优化

基于 [2026-06-04 外部调研报告](../../../research-output/nuxt-windows-build-slow-2026-06-04.md) 中 Vite Performance Guide 的建议，本轮实施 2 项优化：

1. **`vite.server.warmup`** — 预热 app.vue / index.vue / layout / app-header / app-footer，避免首个页面请求才触发 on-demand 转换链。预期减少 dev 首请求延迟。
2. **`vite.resolve.extensions` 收紧** — 从默认 `['.mjs','.js','.mts','.ts','.jsx','.tsx','.json']` 移除未使用的 `.jsx`/`.tsx`，每次 import 减少 2 次 FS stat。全仓无 JSX/TSX 文件，零兼容风险。

### 优化前基线（Phase 42 收口时采集）

| 指标 | 值 | 来源 artifact |
|---|---|---|
| `pnpm perf:nuxt:build` 总耗时 | 490.8s | `nuxt-build-performance.json`（2026-05-13） |
| `pnpm perf:nuxt:dev` 首请求（/favicon.ico） | 58.6s | `nuxt-dev-favicon-performance.json`（2026-05-14） |
| `pnpm perf:nuxt:dev` Local ready | 4.1s | `nuxt-dev-performance.json`（2026-06-05） |

优化后对比数据待本地或 CI `pnpm perf:nuxt:build -- --repeat=1` / `pnpm perf:nuxt:dev -- --repeat=1 --request-path=/favicon.ico` 产出后回填。

## 8. 非目标

- 不在本专项内重写整套安装流程或数据库抽象层。
- 不新起第二套前端性能预算体系；页面体积与 Lighthouse 继续由既有性能规范负责。
- 不把本轮治理扩大为“全仓所有构建慢点一次性清零”。

### 7.1 2026-06-05 Build 挂起根因分析与修复

`pnpm build` 在 Windows 本地持续超时（>900s 无响应），深入排查定位到三个热点：

| 热点 | 根因 | 修复 | 提交 |
|---|---|---|---|
| **Nitro inline 列表过重** | `nitro.externals.inline` 包含 6 个 PrimeVue 前端包（primevue / @primevue/core / icons / styled / styles / themes），这些包已在 Vite 客户端构建中处理完毕，不需在 Nitro 服务端重复打包。6 个前端包的解析 + 转译大幅拉长 Nitro server build。 | 移除 6 个 PrimeVue 前端包，仅保留 `mjml`/`lodash`/`dayjs` 等 13 个运行时必需服务端包 | `nuxt.config.ts` |
| **Server sourcemap** | Nitro 输出 `.output/server/*.map` 文件，Windows NTFS 写大量小文件的 FS 开销显著 | `nitro.sourceMap: false`（dev 构建不需要 sourcemap） | `nuxt.config.ts` |
| **`build:done` hook** | `repairRolldownClientInitImports` 扫描所有 dist chunk 并写回修补文件，不增加 CI/Linux 构建价值但拖累 Windows | Windows 环境下跳过该 hook | `nuxt.config.ts` |

这三项修复预计能将 build 尾耗时从 420s+ 级别显著压缩。精确数据待 CI 或本地复测回填。

## 9. 相关文件

- [nuxt.config.ts](../../../nuxt.config.ts)
- [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts)
- [server/middleware/0b-db-ready.ts](../../../server/middleware/0b-db-ready.ts)
- [server/database/index.ts](../../../server/database/index.ts)
- [scripts/perf/measure-nuxt-lifecycle.mjs](../../../scripts/perf/measure-nuxt-lifecycle.mjs)
- [docs/plan/backlog.md](../../plan/backlog.md)
- [research-output/nuxt-windows-build-slow-2026-06-04.md](../../../research-output/nuxt-windows-build-slow-2026-06-04.md)（外部调研报告）
