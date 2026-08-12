# 脚本治理升格评估报告（第六十五阶段）

> 对应长期主线 #10：脚本治理升格评估
> 生成日期：2026-07-27
> 评估人：@full-stack-master

---

## 1. 评估范围

依据 Phase 65 [`todo.md`](../../plan/todo.md) 第五条主线要求，对以下两个治理脚本进行升格评估：

| 脚本 | npm script | 当前状态 |
|:--|:--|:--|
| `scripts/governance/audit-simple-duplicates.mjs` | `pnpm governance:audit:simple-duplicates` | 独立 baseline（P1 正式入口） |
| `scripts/governance/audit-comment-drift.mjs` | `pnpm governance:audit:comment-drift` | 独立 baseline（P1 正式入口） |

评估目标：判定是否应升格进入 `regression:weekly` warning 面（P2 回归接入阶段）。

---

## 2. 评估方法

依据 [`script-governance.md`](./script-governance.md) 第 4.3 节定义的三段式模型（P0 候选 → P1 正式入口 → P2 回归接入），从以下五个维度评估：

1. **稳定性**：脚本能否稳定输出 baseline，跨轮次可比较
2. **清洁度**：当前运行是否无 warning、无 crash、无误报泛滥
3. **运行时开销**：执行时间是否适合纳入周级回归
4. **互补性**：与 `regression:weekly` 中已有步骤不重叠
5. **结果可消费性**：输出是否结构化、可追踪趋势

---

## 3. 单项评估

### 3.1 `governance:audit:simple-duplicates` → Go ✅

| 维度 | 发现 | 判定 |
|:--|:--|:--|
| **稳定性** | 扫描 1288 个源文件，输出稳定的同名内部函数（114）、同名类型（11）、近似命名函数（10）三类候选，跨轮次字段一致 | ✅ 稳定 |
| **清洁度** | 当前运行零 warning、零 crash，所有候选标记为"待观察"，无非预期退出 | ✅ 清洁 |
| **运行时开销** | 实际执行时间 **~1.64s**，远低于默认 `5m` timeout budget | ✅ 轻量 |
| **互补性** | 与 `duplicate-code:check`（jscpd 行级重复）互补：前者发现命名/类型重复候选，后者发现代码块级重复。两脚本不重叠 | ✅ 互补 |
| **结果可消费性** | 输出 JSON + Markdown，含目录/文件分桶、summary 计数、每条候选定位，可直接用于跨阶段趋势对比 | ✅ 可消费 |

**结论**：**GO** — 建议升格进入 `regression:weekly` warning 面（`required: false`），作为第 11 步。

**阈值建议**：不设硬性阈值。该脚本为 inventory 类盘点，所有候选标记为"待观察"，不触发 exit code 非零。周级回归中作为 non-blocking warning 面，通过 artifact JSON 跨轮次对比趋势。

---

### 3.2 `governance:audit:comment-drift` → Already at P2 ✅

| 维度 | 发现 | 判定 |
|:--|:--|:--|
| **当前状态** | 该脚本已在 `regression:weekly` 中作为第 10 步运行（`required: false`），于 Phase 52 升格 | ✅ 已接入 |
| **稳定性** | 输出四类候选（高复杂度缺注释 182、TODO 0、逐行复述 6、漂移 136），字段稳定 | ✅ 稳定 |
| **清洁度** | TODO 计数归零（Phase 62 治理成果），逐行复述 6（较 Phase 62 的 15 下降 60%），清洁运行 | ✅ 清洁 |
| **运行时开销** | 执行时间 ~5-10s（含文件扫描），在 weekly timeout budget 内 | ✅ 轻量 |
| **互补性** | 唯一覆盖注释质量的治理脚本，与 `eslint-debt`、`duplicate-code` 均不重叠 | ✅ 互补 |

**结论**：**GO（已升格）** — 该脚本实际已接入 `regression:weekly`，无需重复操作。但 `script-governance.md` 第 5.4 节的描述未同步更新（仍写"不接入固定回归"），需做文档同步。

**阈值建议**：保持 `required: false` warning 面。当前的 TODO=0、restatement=6 可作为自然基线，人工跟踪趋势即可，无需硬性阈值。

---

## 4. 当前 `regression:weekly` 治理脚本全景

升格后，`regression:weekly` 的治理类 steps 如下：

| 步骤 | npm script | required | 职责 |
|:--|:--|:--|:--|
| 7 | `duplicate-code:check` | ❌ | jscpd 行级重复基线 |
| 8 | `governance:check:scripts` | ❌ | 脚本资产自身健康度 |
| 9 | `governance:audit:eslint-debt` | ❌ | ESLint 规则债 inventory |
| 10 | `governance:audit:comment-drift` | ❌ | 注释质量 inventory |
| 11 | **`governance:audit:simple-duplicates`** | ❌ | 命名/类型重复 inventory（新增）|

所有治理脚本均为 `required: false`，输出 warning 而非 blocker，通过 artifact JSON 追踪趋势。此举符合 [`script-governance.md`](./script-governance.md) 第 6.1 节"第二轮稳定 → 周级 warning"的接入策略。

---

## 5. 影响分析

### 5.1 对 `regression:weekly` 运行时影响

- 新增 `simple-duplicates` 步骤增加约 **+1.6s** 执行时间
- 现有 11 步中，`test:coverage`（~30m）和 `security:audit-deps`（~10m）占主导，1.6s 增量可忽略
- 不改变 required/blocker 语义

### 5.2 对 `script-governance.md` 的影响

第 5.2 节（简单重复盘点）当前状态描述"暂不接入固定回归"需更新为"已接入 `regression:weekly`（Phase 65）"。
第 5.4 节（注释治理 inventory）当前状态描述"不接入固定回归"需更新为"已接入 `regression:weekly`（Phase 52）"。

### 5.3 对长期主线 #10 的影响

本次评估闭环后，长期主线 #10（脚本治理）的四条治理脚本全部进入 `regression:weekly` warning 面：
- `check-script-governance` ✅（Phase 52）
- `audit-eslint-debt` ✅（Phase 54）
- `audit-comment-drift` ✅（Phase 52）
- `audit-simple-duplicates` ✅（本阶段 Phase 65）

---

## 6. 实施计划

1. ✅ `scripts/regression/run-periodic-regression.mjs`：将 `audit:simple-duplicates` 加入 `weekly` profile 第 11 步
2. ✅ `docs/design/governance/script-governance.md`：同步 5.2 节和 5.4 节的状态描述
3. ✅ 验证：`pnpm governance:audit:simple-duplicates` 和 `pnpm governance:audit:comment-drift` 均清洁运行
