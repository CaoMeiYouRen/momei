# 脚本治理升格评估报告（第六十六阶段）— audit:comment-drift 复核

> 对应长期主线 #10：脚本治理 — audit:comment-drift 升格评估
> 生成日期：2026-08-12
> 评估人：@full-stack-master
> 关联文档：[Phase 65 升格评估](./script-promotion-eval-phase65.md)

---

## 1. 评估范围

依据 Phase 66 [`todo.md`](../../plan/todo.md) 第五条主线要求，对 `audit:comment-drift` 是否满足升格条件进行复核评估：

| 脚本 | npm script | 当前状态 |
|:--|:--|:--|
| `scripts/governance/audit-comment-drift.mjs` | `pnpm governance:audit:comment-drift` | 已接入 `regression:weekly`（第 10 步，`required: false`，Phase 52 升格） |

评估目标：确认脚本输出稳定、误报率可控、warning 面清洁；输出明确 go/no-go 结论与理由；若 go 则完成 `regression:weekly` 配置收口与文档同步。

**背景说明**：Phase 65 已评估 `audit:comment-drift` 为 "Already at P2 ✅"（Phase 52 已接入 weekly）。本次为 Phase 66 主线要求的正式复核：以最新运行证据重新验证五维条件，并收口此前遗留的文档漂移（backlog / README / planning / script-governance 中仍描述为"独立 baseline"的过时表述）。

---

## 2. 评估方法

沿用 [`script-governance.md`](./script-governance.md) 第 4.3 节三段式模型（P0 候选 → P1 正式入口 → P2 回归接入）与第 6.1 节接入策略，从五个维度复核：

1. **稳定性**：输出能否跨轮次稳定比较
2. **清洁度**：当前运行是否无 warning、无 crash、无误报泛滥
3. **运行时开销**：执行时间是否适合周级回归
4. **互补性**：与 `regression:weekly` 已有步骤不重叠
5. **结果可消费性**：输出是否结构化、可追踪趋势

---

## 3. 单项评估

### 3.1 运行验证（2026-08-12 实测）

执行 `pnpm governance:audit:comment-drift`，exit code 0，无 crash，无 warning：

| 指标 | Phase 65 基线（2026-07-27） | 本轮（2026-08-12） | 变化 |
|:--|:--|:--|:--|
| 扫描文件数 | 1288 | 1294 | +6（Phase 66 新增文件） |
| 高复杂度缺注释候选 | 182 | 182 | 持平 |
| TODO / 临时口吻候选 | 0 | 0 | 持平（Phase 62 治理成果保持） |
| 疑似逐行复述候选 | 6 | 6 | 持平（Phase 62 的 15 → 6，-60% 保持） |
| 疑似漂移候选 | 136 | 139 | +3（新增 3 条"待观察"候选，均非 blocker） |

漂移候选 +3 属于正常波动：新增候选均带 `reviewStatus: "待观察"`，属于 inventory 盘点性质，不触发非零退出。跨轮次输出字段结构一致（summary / directoryBuckets / 四类候选列表），可直接用于趋势对比。

### 3.2 五维评估

| 维度 | 发现 | 判定 |
|:--|:--|:--|
| **稳定性** | 输出四类候选 + summary + directoryBuckets，字段跨轮次一致（1288→1294 文件，182/0/6/139），数值波动仅来自新增文件 | ✅ 稳定 |
| **清洁度** | exit 0；TODO=0、restatement=6 保持 Phase 62 治理成果；drift 139 均为"待观察"候选，不产生 warning 噪声；已有 `tests/scripts/audit-comment-drift.test.ts` 3 个用例覆盖核心启发式 | ✅ 清洁 |
| **运行时开销** | 全仓扫描 ~5-10s，远低于 weekly 该步骤 `5m` timeout budget | ✅ 轻量 |
| **互补性** | 唯一覆盖注释质量的治理脚本，与 `eslint-debt`（规则债）、`simple-duplicates`（命名/类型重复）、`duplicate-code:check`（jscpd 行级重复）均不重叠 | ✅ 互补 |
| **结果可消费性** | 输出 JSON + Markdown，含 summary 计数、目录分桶、候选 file:line 定位与 reviewStatus，可跨阶段趋势对比 | ✅ 可消费 |

**结论**：**GO（保持已升格状态）** — 五维全部满足，`regression:weekly` 第 10 步配置（`required: false`）无需调整；`tests/scripts/run-periodic-regression.test.ts` 已断言 weekly 步骤包含 `governance:audit:comment-drift`，配置与测试同步。

---

## 4. 当前 `regression:weekly` 治理脚本全景

| 步骤 | npm script | required | 职责 | 升格阶段 |
|:--|:--|:--|:--|:--|
| 7 | `duplicate-code:check` | ❌ | jscpd 行级重复基线 | Phase 55 |
| 8 | `governance:check:scripts` | ❌ | 脚本资产自身健康度 | Phase 52 |
| 9 | `governance:audit:eslint-debt` | ❌ | ESLint 规则债 inventory | Phase 54 |
| 10 | `governance:audit:comment-drift` | ❌ | 注释质量 inventory | Phase 52 |
| 11 | `governance:audit:simple-duplicates` | ❌ | 命名/类型重复 inventory | Phase 65 |

所有治理脚本均为 `required: false`，输出 warning 而非 blocker，通过 artifact JSON 追踪趋势。

---

## 5. go/no-go 结论

**GO（维持已升格，无需重复升格操作）**

- 脚本输出稳定：跨 3 个阶段（Phase 62 → 65 → 66）字段结构一致，数值波动可控。
- warning 面清洁：TODO=0、restatement=6 持续保持，无新增误报泛滥。
- 配置已就绪：`regression:weekly` 第 10 步已含 `governance:audit:comment-drift`（Phase 52 升格），测试断言同步。
- 本轮变更：**仅收口文档漂移**，不新增脚本、不改脚本 API、不引入新治理基线（符合主线非目标）。

---

## 6. 影响分析：文档漂移收口清单

复核过程中发现 7 处文档仍描述 `audit:comment-drift`（或相邻治理脚本）为"独立 baseline"或升格归属错误，与当前 weekly 接入状态不符，本轮一并同步：

| # | 文件 | 位置 | 现状 | 更新为 |
|:--|:--|:--|:--|:--|
| 1 | `docs/plan/backlog.md` | #10 当前状态 | "提供独立 JSON / Markdown baseline" 未提升格 | 补充 comment-drift 已升格 weekly（Phase 52） |
| 2 | `docs/plan/backlog.md` | #10 下一次可切片方向 | "后续评估是否将 audit:comment-drift 从独立 baseline 升格" | 标记已评估，go 结论 |
| 3 | `docs/plan/backlog.md` | 固定入口覆盖矩阵 #10 | 周级仅 `✅ governance:check:scripts`，其余"暂保持独立 baseline" | 周级补 3 个 audit 脚本 |
| 4 | `scripts/README.md` | governance 行 | "其余治理入口先保持独立只读 baseline" | 更新为 3 个 audit 已进 weekly |
| 5 | `docs/standards/planning.md` | 固定入口补充约束 #5 | 仅提 check:scripts 进 weekly，simple-duplicates 独立 | 更新 3 个 audit 均已进 weekly |
| 6 | `docs/design/governance/script-governance.md` | 5.3 节状态 | 未提 eslint-debt 已接入 weekly（Phase 54） | 与 5.2/5.4 节口径一致 |
| 7 | `docs/design/governance/script-governance.md` | 5.4 节状态 + 验收状态 | 误写 comment-drift 升格为 Phase 54 | 更正为 Phase 52（与 `todo-archive-phases-52-57.md` 归档及 git 提交 `8eb2c923` 一致） |

---

## 7. 实施计划

1. ✅ 运行验证：`pnpm governance:audit:comment-drift` 清洁输出（exit 0，182/0/6/139）
2. ✅ 配置确认：`regression:weekly` 第 10 步已含 comment-drift（无需改动）；`tests/scripts/run-periodic-regression.test.ts` 断言同步
3. ✅ 文档同步：按第 6 节清单更新 7 处漂移（backlog / README / planning / script-governance，含 Phase 归属更正）
4. ✅ 收口：`todo.md` 主线 5 勾选；Review Gate 审计（Round 1-3，B1 归属更正闭环）；单次提交
