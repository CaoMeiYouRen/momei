# @vite-pwa/nuxt 2.0.1 追溯评估与去留结论

- 阶段: 第七十九阶段条目 6（依赖 PR 处置与已合并 major 的追溯评估）
- 日期: 2026-11-18
- 对象: `@vite-pwa/nuxt` `1.1.1 → 2.0.1`（Mergify 于 `cedcc241` 自动合并，早于评估落地）
- 事实源: `package.json`、`nuxt.config.ts` 的 `pwa` 段、`.output` 构建产物、`pnpm-lock.yaml`

## 1. 影响面

| 维度 | 1.1.1 | 2.0.1 | 结论 |
|:---|:---|:---|:---|
| 底层实现 | `vite-plugin-pwa` | `@unplugin-pwa/*` + `@vite-pwa/workbox-*`（`@vite-pwa/nuxt-core` 2.0.1） | 配置键保持兼容，但实现链换代 |
| Workbox | 7.x | `@vite-pwa/workbox-build` ^8.0.15（`workbox-build@8.0.15` / `workbox-window@8.0.15`） | 主版本换代 |
| 注册方式 | 注入注册脚本 | Nuxt client plugin（`client.registerPlugin` 默认 `true`），内部用 `workbox-window` 注册 `/sw.js` | 构建产物已确认注册链存在 |
| 策略配置 | `workbox` 选项 | `workbox` 仍可用但已标记 deprecated（后续应迁到 `generateSW`） | 当前配置继续生效，留作后续迁移项 |
| Node 要求 | — | ≥ 22.14（unplugin-pwa 基线） | 本项目 `.nvmrc` 26.13.1，满足 |

无 API 形状变化落在本项目使用面上：`pwa.registerType` / `manifest` / `shortcuts` / `workbox.*` / `devOptions` 均未改动即通过构建。

## 2. 构建产物实测（2026-11-18，`pnpm build`）

| 检查项 | 实测 | 结论 |
|:---|:---|:---|
| `sw.js` 生成 | `.output/public/sw.js` 存在，`importScripts("./workbox-f2d0f07d.js")` | 经典 SW + 独立 Workbox 运行时（未内联） |
| 预缓存清单 | `_nuxt/**` JS/CSS 全量 + `favicon.ico` / `logo.png` / `manifest.webmanifest` / `web-push-sw.js` | `globPatterns` 生效 |
| `skipWaiting` / `clientsClaim` | `self.skipWaiting()` 与 `clientsClaim` 调用存在 | `autoUpdate` 语义保留 |
| `cleanupOutdatedCaches` | 产物含对应调用 | 旧缓存清理保留 |
| `navigateFallback` + denylist | `navigateFallback: '/'` 且 `denylist: [/^\/.*$/]` | 与配置一致：SSR 部署不回放旧 app shell |
| Manifest | `manifest.webmanifest` 存在，含名称 / 主题色 / 图标 / 快捷方式 | 与 1.1.1 意图一致 |
| 客户端注册 | `_nuxt/DgXfJAwL.js` 内 `f='/sw.js'` + `Workbox(f,{scope:'/',type:'classic',updateViaCache:c})` | v2 的 client plugin 注册链生效，不是「只产 SW 不注册」 |
| 离线 / 更新语义 | 更新：`autoUpdate` + skipWaiting 立即接管；离线：导航回落被 denylist 主动关闭，仅静态资源可离线 | 与升级前策略一致，无行为回退 |

配套验证：`pnpm probe:build-geometry` 3/3 通过（同一构建产物服务化后实测）；`pnpm i --frozen-lockfile` 通过。

## 3. 已知风险与上游缺陷

1. **2.0.1 的上游缺陷（已有修复版本）**：v2.0.2（2026-11-18 发布）修复 “keep the service worker and manifest route rules when Nuxt rebuilds them”（#241）。本项目为 SSR 单次构建、SW 走静态文件，当前未触发；但下一次 Nuxt 重建相关的依赖升级应优先抬到 `^2.0.2`。
2. **`workbox` 选项进入 deprecated 通道**：unplugin-pwa 将策略选项迁到 `generateSW`，`workbox` 将在下一个 major 移除。本项目应在本阶段之后单独排一条迁移项，不与本次追溯评估混做。
3. **`injectRegister` 默认值变化**：v2 默认 `false`，但 `client.registerPlugin` 默认 `true`，注册由 Nuxt 插件承担；若未来显式关闭 `client.registerPlugin`，必须同时设置 `injectRegister`，否则 SW 静默不再注册。

## 4. 结论

**保留 `@vite-pwa/nuxt` 2.0.1，不回滚。** 依据：构建产物、注册链、Workbox 8 运行时与既有 PWA 策略全部按预期生效；无行为回退；CI（Test / Pages / Docker / Daily）在合并提交与当前 master 上均绿。

回滚步骤（仅在后续发现 SW 注册 / 预缓存失效且无法快速修复时启用）：

```bash
# 1) 回退依赖声明并重解析锁文件
pnpm remove @vite-pwa/nuxt
pnpm add -D @vite-pwa/nuxt@^1.1.1
pnpm i --frozen-lockfile
# 2) 重新构建并确认 Workbox 7 产物
pnpm build && ls .output/public/sw.js .output/public/workbox-*.js
# 3) 客户端清理旧 SW（浏览器已装 v2 SW 时）：
#    控制台执行 navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
#    并清空站点数据后重新访问，避免旧 SW 继续接管
```

回滚边界：仅回退 `package.json` / `pnpm-lock.yaml`，不改 `nuxt.config.ts` 的 `pwa` 段（两版配置键兼容）。

## 5. 后续跟踪

- [x] 下次依赖窗口把 `@vite-pwa/nuxt` 抬到 `^2.0.2`（patch，含 #241 修复），仍走常规依赖 PR；
- [x] 单独立项评估 `workbox` → `generateSW` 选项迁移（deprecated 移除前完成）；
- [ ] 系统性解法（major 不自动合并 / merge queue）保持在 [backlog 长期主线 §10](../../plan/backlog.md) 待用户确认。

## 6. 2026-11-19 执行记录（第八十阶段条目 5）

`@vite-pwa/nuxt` 升至 `^2.0.2`（锁定 `2.0.2`），`nuxt.config.ts` 的 `pwa.workbox` 改为 `pwa.generateSW`，配置项 `cleanupOutdatedCaches` / `clientsClaim` / `skipWaiting` / `navigateFallback` / `navigateFallbackDenylist` / `globPatterns` 原样迁移。

| 检查项 | 实测 | 结论 |
|:---|:---|:---|
| `pnpm i --frozen-lockfile` | 通过（锁文件已随版本声明更新） | 一致 |
| `pnpm build` | 退出码 0，构建日志无 `workbox option deprecated` 提示 | 迁移生效 |
| `sw.js` | 23,402 B（迁移前后同字节数），预缓存 535 条；除 `_nuxt/builds/latest.json` 修订哈希与 build id 外逐字节相同 | 语义一致 |
| `workbox-*.js` | 运行时文件名与内容与迁移前完全相同 | 语义一致 |
| `manifest.webmanifest` | 与迁移前逐字节相同 | 语义一致 |
| `pnpm probe:build-geometry` | 3/3 | 通过 |
| `pnpm test:visual` / `test:visual:parity` | 32/32、83/83（未归因差异 0） | 通过 |
| `security:audit-deps` / `security:alerts` | 均 Pass | 通过 |

证据：`artifacts/review-gate/2026-11-19-phase80-item5/`（`before/` 与 `after/` 各含 `sw.js`、`workbox-f2d0f07d.js`、`manifest.webmanifest`）与 `artifacts/review-gate/2026-11-19-phase80-item5.md`。

回滚边界不变：`package.json` / `pnpm-lock.yaml` / `nuxt.config.ts` 的 `pwa` 段同批 revert。

