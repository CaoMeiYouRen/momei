# 包体余量评估与 MDI CSS 瘦身（2026-11-27）

> 主文档：[性能规范 §4 前端包体预算](../../standards/performance.md)。基线文件：`.github/perf/bundle-baseline.json`（未修改）。

## 1. 结论

- `keyCss` 由 **60.49KiB gzip** 降至 **10.92KiB gzip**，节省 **49.57KiB**（≥2KB 验收线），预算 62KB 未放宽；gzip 为构建产物实测值。
- 瘦身来源：首屏全局加载的 `@mdi/font/css/materialdesignicons.css`（418KB 原始 / 53.9KB gzip）替换为只含 10 个实际使用图标的子集（1.5KB 原始 / 0.7KB gzip）。
- `coreEntryJs` / `maxAsyncChunkJs` / `prIncrementJs` 保持预算内，未做无归因改动。

## 2. 前后对比

同一 HEAD 干净重建与改动后实测（KiB）：

| 指标 | 修改前 | 修改后 | 预算 | 结论 |
| :--- | ---: | ---: | ---: | :--- |
| `keyCss` | 60.49 | **10.92** | 62 | 减少 49.57 |
| `coreEntryJs` | 294.43 | 294.42 | 335 | ≈0，未归因于本条目 |
| `maxAsyncChunkJs` | 93.18 | 93.18 | 130 | 无变化 |
| `prIncrementJs` | 13.81 | 13.80 | 20 | ≈0，未归因于本条目 |

## 3. Top 贡献者

### 3.1 keyCss（本次唯一处理项）

按 bundle 实测口径（keyCss 由 60.49KiB → 10.92KiB）：

| 贡献者 | 修改前占比 | 修改后 | 处理 |
| :--- | ---: | ---: | :--- |
| `@mdi/font` 全量 CSS | 约 50.3KiB（83%） | 0（子集约 0.7KiB） | 子集化，仅保留 10 个使用图标 |
| 其余全局样式 | 约 10.2KiB（17%） | 10.2KiB | 保留 |

### 3.2 coreEntryJs（未处理）

| 文件 | gzip | 说明 |
| :--- | ---: | :--- |
| `HMaNixZe.js` | 56.1KB | Vite 依赖 preload 映射表，条目数由路由/异步 chunk 决定；压缩后仍属高熵数据，删减需重构构建策略，风险大于收益 |
| `BggP3Q6G.js` | 50.8KB | Vue 运行时 |
| `NPhoOW1a.js` | 23.2KB | Nuxt app / 路由运行时 |
| 其余 | — | 应用 composables 与第三方依赖 |

### 3.3 maxAsyncChunkJs（未处理）

- 最大异步 chunk `qOA2atN42.js` 93.18KiB，为 **Sentry 11.16.0（含 Replay）** 打包块，预算 130KiB、余量 36.82KiB。尝试评估移除 Replay / 部分 integration：会丢失会话回放与错误上下文，属产品能力取舍，未在本条执行，登记为后续性能/可观测性联合评估项；不做无归因拆分。

## 4. 实施

- 新增 `styles/mdi-subset.css`：保留 `@font-face`（仍指向 `@mdi/font` 字体文件，Vite 正常哈希产出 woff2/woff/ttf）与 `.mdi` 基础类、10 个图标映射：facebook / github / google / instagram / linkedin / patreon / stack-overflow / twitch / twitter / youtube。
- `nuxt.config.ts` 的 `css` 数组由全量 CSS 改为子集文件。
- 新增 `tests/scripts/mdi-subset.test.ts`：扫描 `components` / `pages` / `utils` 中的 `mdi-*` 类，任何未收录图标都会让测试失败，防止后续动态类静默缺字形。

## 5. 验证

| 门 | 结果 |
| :--- | :--- |
| `pnpm build` | EXIT 0；产物含 hashed MDI 字体与 11 个字号 token |
| `pnpm test:perf:budget:strict` | Pass：keyCss 10.92 / 62KB、coreEntryJs 294.42 / 335KB、maxAsync 93.18 / 130KB、prIncrement 13.80 / 20KB |
| `pnpm exec vitest run tests/scripts/mdi-subset.test.ts` | 通过 |
| `pnpm lint` / `lint:css` / `typecheck` | 0 error / 0 error / EXIT 0 |
| 视觉 | 图标字形来自同一字体文件、同一 codepoint，未改字号与布局；由 CI Visual / parity 复核 |

## 6. 未覆盖边界与失败原因

- 未处理 `coreEntryJs` 的 preload 映射与 Vue/Nuxt 运行时：属框架产物，拆分或外置会改变加载语义，实测无可归因的 ≥2KB 安全削减。
- 未处理最大异步 chunk（Sentry 含 Replay）：移除会损失会话回放，未在本条执行。
- MDI 子集只覆盖当前源码静态引用的 10 个图标。文章正文支持 `html: true` 且保留 `span/a/div/p` 的 class，作者在已发布内容里写入任意 `mdi-*` 时会静默缺字形；后台配置若允许任意类名同理。守卫测试只扫描 `components/pages/layouts/utils/composables` 的静态字面量，不覆盖 DB 内容与动态拼接。
- 字体文件本身未子集化：woff2 约 403KB 仍按需下载；本条只削减 CSS 体积。
- 未放宽预算、未修改 `.github/perf/bundle-baseline.json`。

## 7. 回滚

恢复 `nuxt.config.ts` 的 `@mdi/font/css/materialdesignicons.css` 引用并删除子集文件与守卫测试即可；预算文件无需回退。
