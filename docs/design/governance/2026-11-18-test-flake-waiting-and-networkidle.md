# 管理端单测等待口径与 `networkidle` 处置结论

- 阶段: 第七十九阶段条目 1（测试 flake 收敛与门禁可信度）
- 日期: 2026-11-18
- 范围: Vitest 组件 / 页面用例的「交互 → 断言」等待口径；E2E 与视觉门禁的 `networkidle` 依赖
- 事实源: `tests/helpers/ui-interaction.ts`、[测试规范 §7.3](../../standards/testing.md)

## 1. 现象与复现边界

第七十八阶段收口时，`pnpm regression:phase-close` 本机连跑 5 次被 4 处管理端点击时序问题阻断（`snippet-edit-dialog` / `external-links` / `app-uploader` / `admin/users` / `commercial-settings` / `agreements-settings`），全部表现为「交互后 mock 0 次调用」或「断言读到首帧状态」，孤立复跑 100% 通过。

本次收口先做复现尝试：6 个已知文件在 4 路并发、每轮 4 个 worker 的负载下连跑 24 次全部通过（`artifacts/review-gate/flake-stress/`）。结论：抖动的触发条件是**全量 coverage 并发 + 时序耦合**，在文件级定向运行中不可稳定复现；因此按「先定位可证伪的确定性缺陷，再统一等待口径」处置，而不是登记为不可解环境抖动。

## 2. 已定位的确定性缺陷

| 缺陷 | 位置 | 后果 |
|:---|:---|:---|
| 可选链静默跳过交互 | `agreements-settings.test.ts` 的 `findButton(...)?.trigger('click')` | 异步数据未渲染出按钮时**不报错**，断言处表现为「mock 0 次调用」的假 flake；真实原因是交互目标缺失 |
| 单次 `nextTick()` 等待 async 处理器 | `users` / `external-links` / `snippet-edit-dialog` / `app-uploader` | `nextTick` 只推进渲染队列，不保证处理器内部的 `await` 链已跑完；异步副作用断言可能读到中间态 |
| 挂载后不等首帧数据 | `commercial-settings` / `external-links` 的 `mountComponent` | `onMounted` 拉取未落地就断言首帧 DOM，负载高时读到空态 |
| 单次 `flushPromises()` 不覆盖渲染 flush | `agreements-settings` | 微任务排空与 Vue patch 是两段，仍需一次显式渲染等待 |

## 3. 统一口径

新增 `tests/helpers/ui-interaction.ts`，三个入口：

| 辅助 | 语义 | 使用场景 |
|:---|:---|:---|
| `settleUi()` | `flushPromises()` + `nextTick()`：排空微任务链并等待渲染 flush | 所有「点击 / 输入 / 拖放 → 断言」之间 |
| `clickWhenReady(target, description)` | 目标缺失即抛错，命中后点击并 `settleUi()` | 替代 `?.trigger('click')`，禁止静默跳过 |
| `expectEventually(assertion)` | `vi.waitFor` 有界等待（默认 2s） | 断言异步副作用最终发生；超时仍失败，不重试用例 |

约束：

- 禁止用 `waitForTimeout` / 固定 sleep 替代可观测状态等待。
- 禁止以 `--retry`、`.skip` / `.only`、降低断言强度换取绿色。
- `expectEventually` 只放宽「何时断言」，不放宽「断言什么」；超时后抛出的是最后一次断言错误。
- 交互目标必须显式断言存在，不允许可选链静默降覆盖。

## 4. `networkidle` 待跟踪项处置结论

结论：**明确保留，不上收为独立条目**。依据：

1. `networkidle` 只影响 E2E / 视觉层的**就绪判定**，不影响单元层结论；本阶段 flake 全部位于单元层，二者不是同一根因。
2. CI（有外网 + 单 worker）是门禁最终裁决；本地无外网属于已知环境缺口，已有明确降级路径：parity 路由标 `stable: 'lenient'`、设置页等水合后再交互、登录态 SSE 页面改用业务锚点。
3. 收窄为「阻断非本地请求」需要改 Playwright 路由拦截与全部视觉基线的就绪语义，收益不足且会引入新的跨环境差异；按 [项目规划规范 §4.5](../../standards/planning.md) 留在 backlog 观察，不作为本阶段交付。

保留条件（任一出现即重新评估）：CI 上出现 `networkidle` 超时类失败连续 2 次；新增路由因 SSE / 长期轮询必须逐个登记 `lenient`，导致豁免面超过 3 条。

## 5. 回归口径

- 6 个已知文件连跑 20 次 0 失败（证据：`artifacts/review-gate/2026-11-18-phase79-item1-flake-20x/`）。
- `pnpm test:coverage` 连跑 3 次全绿且无 retry。
- `pnpm regression:phase-close` 一次 Pass（端口占用时 `E2E_PORT=3011`）。
