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

### 3.3 对照目标口径

当前 Windows 本地 build 基线约为 `542.77s`，已经明显偏离可接受区间。结合本轮讨论，后续治理统一采用两级目标：

- 第一目标：先把 Windows 本地 `pnpm perf:nuxt:build -- --repeat=3` 的总耗时中位数压到 `<= 500s`，优先解决“明显偏离日常可用”的问题。
- 第二目标：在 `<= 500s` 达成后，继续向 Linux 侧约 `120s` 级别的参考体验靠近；该 `120s` 目前作为对照目标使用，不视为当前仓库已验证可直接达到的承诺值。

因此，后续所有优化讨论都应先回答“能否把 Windows 从 542s 级别压进 500s 内”，再讨论如何继续逼近 `120s` 档位，而不是一开始就把两种目标混为一谈。

## 4. 已确认热点

### 4.1 Dev 首请求阻塞

当前最强信号来自两个中间件：

- [server/middleware/0b-db-ready.ts](../../../server/middleware/0b-db-ready.ts) 会跳过 `/` 与 `/api/settings/public`，因此它不是这两个请求共同超时的直接原因。
- [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts) 在安装状态缓存为空时，会同步执行 `initializeDB()`，随后再调用 `getInstallationStatus()`。

这意味着：

1. 即便公共 API 或首页本身不需要在首包前做完整数据库预热，首次请求仍可能被安装状态探测链路阻塞。
2. 当前阻塞更像“请求级全局冷路径”，不是单个页面首屏渲染逻辑过重。

同时，[server/database/index.ts](../../../server/database/index.ts) 中的 `initializeDB()` 还串行执行了：

- `AppDataSource.initialize()`
- `syncAdminRoles()`
- `repairLegacyPostVersionRecords()`

对于“只是判断系统是否已安装”的首请求来说，这条初始化链过重，至少需要继续拆分和量化。

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
   - 优先围绕 [server/middleware/0-installation.ts](../../../server/middleware/0-installation.ts) 设计更轻量的“已安装”判断链路，避免在首请求上同步触发完整 `initializeDB()`。
   - 本步先回答“哪些路径必须等 DB fully ready，哪些路径只需要 installation state”，再决定代码切片，不在当前文档轮次内直接开改。

2. 再补齐 `initializeDB()` 的分阶段观测设计。
   - 至少拆开 `AppDataSource.initialize()`、`syncAdminRoles()`、`repairLegacyPostVersionRecords()` 三段口径，确保后续改动前就知道慢点具体落在哪一段。

3. 然后进入 build 长尾专项剖析。
   - 在 `perf:nuxt:build` 现有结果基础上，继续统计 `serverBuilt -> process exit` 长尾，并补 `.output/server` chunk 数量、sourcemap 数量、最大服务端 chunk 与总文件写出规模。
   - 这一轮的首要收益目标不是立刻追到 `120s`，而是先为“压进 `500s` 内”提供可执行的热点清单。

4. 保持 Windows 定向优化边界。
   - PWA、Nitro trace、inline 包等 Windows 特殊口径应继续限定在“本地 Windows 优化”范围内，不把这轮专项扩写成全平台构建重构。

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
