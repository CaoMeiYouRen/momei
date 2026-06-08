# Phase 37 执行计划

**时间表**: 2026-05-11 ~ 约 1 - 2 周
**目标**: 在第三十六阶段完成运行时稳态补漏与结构治理收口后，继续以“0 个新功能 + 5 个优化”的受控组合推进下一阶段，优先收敛 Windows 本地 `nuxt dev` / `nuxt build` 阻塞体验，同时补一轮高风险测试有效性、ESLint / 类型债窄切片、至少 3 处结构复用热点，以及 Postgres 长窗口复核闭环。

## 准入结论

五条主线均来自 `docs/plan/backlog.md` 的长期主线任务，总数控制在 `5` 项内，符合当前阶段容量约束。本阶段不引入新功能，执行优先级为 `2 个 P0 + 3 个 P1`。

## 执行约束

- 所有主线进入实现前必须先冻结命中清单、替代方案、收益与回滚边界。
- Windows 性能治理与 Postgres 复核必须先补证据，再决定具体改动，不允许跳过观测直接大改。
- 结构复用治理至少完成 `3` 处热点，但不得把复杂业务逻辑伪装成共享框架。
- 测试有效性与 ESLint / 类型债切片都必须维持“窄范围 + 可验证 + 可回退”的节奏。

---

## 主线 1：Windows 本地 Dev / Build 性能治理（P0）

**执行范围**:

1. 冻结 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 的 installation state 探测边界，明确哪些路径只需要 installation state、哪些路径才必须等待完整 `initializeDB()`。
2. 为数据库初始化与冷请求路径补齐分阶段耗时口径，统一沉淀到 [windows-dev-build-performance-governance.md](./windows-dev-build-performance-governance.md) 与 `artifacts/nuxt-*-performance.json`。
3. 进入 `Server built -> Build complete` 长尾专项剖析，优先检查 Nitro / `.output/server` 写出规模、chunk 与 sourcemap。

**非目标**:

- 不扩写为全平台构建重构。
- 不并行开启 Cloudflare 运行时、PWA 或 bundle 体系重做。

**验收标准**:

- `pnpm perf:nuxt:dev -- --repeat=3` 下首页与 `/api/settings/public` 首请求中位数进入 `<= 15s`。
- `pnpm perf:nuxt:build -- --repeat=3` 总耗时中位数先压进 `<= 500s`。
- 输出新的性能证据文件并更新治理文档。

---

## 主线 2：测试有效性切片（P0）

**执行范围**:

1. 从前端直连 TTS、AI task `estimated / actual` 口径一致性、认证退化与公开热点读链路中，选择已有测试基座且回归风险最高的 `2 - 3` 组路径。
2. 优先补失败断言、边界断言与统计一致性验证，而不是单纯补 coverage。
3. 将新增入口并入可复用的定向回归矩阵，并记录未覆盖边界。

**非目标**:

- 不回到低价值铺量测试。
- 不把 snapshot 补量当作主要成果。

**验收标准**:

- 至少补齐 `2` 组高风险失败路径或边界断言。
- 其中至少 `1` 组覆盖统计一致性或比成功路径更高价值的回归风险。
- 明确记录本轮未覆盖边界与下一轮优先顺序。

---

## 主线 3：ESLint / 类型债治理（P1）

**执行范围**:

1. 按“单规则 + 单文件 / 双文件”继续推进窄切片。
2. 本轮优先上收 [server/services/ai/asr.ts](../../server/services/ai/asr.ts) 的 `@typescript-eslint/no-explicit-any` 高 ROI 候选。
3. 实施前先冻结命中清单、替代写法、回滚边界与最小验证矩阵。

**非目标**:

- 不并行开启 `no-unsafe-*` 或全仓 `any` 清零工程。
- 不回到低收益的大范围目录治理。

**验收标准**:

- 定向 ESLint 与 `nuxt typecheck` 通过。
- 残余债务与下一轮候选有明确记录。

---

## 主线 4：结构复用治理：至少 3 处热点收敛（P1）

**执行范围**:

1. 至少完成 `3` 处热点复用，优先从以下候选中选择：
   - `pages/admin/subscribers/index.vue` vs `pages/admin/waitlist/index.vue`
   - `pages/admin/ad/campaigns.vue` vs `pages/admin/ad/placements.vue`
   - `server/utils/email/service.ts`
   - `components/commercial-link-manager.vue`
2. 对每组候选先写清共享边界、收益与回滚方式。
3. 复核 `pnpm duplicate-code:check` 基线不反弹，并补记结构性重复盘点结论。

**非目标**:

- 不发起跨目录大重构。
- 不重复统计第三十六阶段已收口的 TTS task 双端点复用。

**验收标准**:

- 至少 `3` 处热点完成复用收敛。
- `duplicate-code` 基线不反弹。
- 结构性重复盘点结果有留痕。

---

## 主线 5：Postgres 长窗口复核切片（P1）

**执行范围**:

1. 先补一组 `pg_stat_statements` 或等价 live sample 长窗口样本。
2. 在“请求入口组”与“公开热点读链路组”中二选一推进最小治理动作。
3. 优先回答“当前哪些请求最耗 CPU、最拉长连接寿命”。

**非目标**:

- 不并行推进多个请求组。
- 不把本轮扩写为全站数据库性能重构。

**验收标准**:

- 至少形成一组可复核的长窗口样本。
- 能明确指出当前最重的 SQL / 请求组。
- 若进入代码实现，只允许绑定一个最小治理动作并说明收益假设。
