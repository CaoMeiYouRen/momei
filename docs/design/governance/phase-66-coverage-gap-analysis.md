# Phase 66 测试覆盖率缺口分析（第八批）

> 分析日期: 2026-08-07
> 数据来源: GitHub Actions CI（Test 工作流 `31187998017` Coverage job + Weekly Regression `31188164527`）
> 基线数据: `pnpm test:coverage` — 4270 tests passed / 1 skipped（全仓 Statements 79.55%, Branches 67.94%, Funcs 78.25%, Lines 79.56%）

## 1. 全仓覆盖率基线（CI 实测）

| 指标 | CI 数值（2026-08-07） | Phase 65 归档值 | 变化 |
| :--- | :--- | :--- | :--- |
| **Statements** | **79.55%** | 79.48% | +0.07% |
| Branches | 67.94% | 67.93% | +0.01% |
| Functions | 78.25% | 78.2% | +0.05% |
| Lines | 79.56% | 79.49% | +0.07% |
| 测试数 | 4270 passed / 1 skipped | 4271 总数 | — |

> ⚠️ **验收差距**: 第八批目标 Statements ≥80.48%（相对 Phase 65 归档值 +≥1%）。当前 CI 基线 79.55%（Test job）~ 79.48%（Weekly Regression job），需覆盖提升 **~0.93%~1.0%**。

## 2. 分层缺口盘点

### 2.1 目录汇总（重点层）

| 目录 | Stmts% | Branch% | 评估 |
| :--- | :--- | :--- | :--- |
| `server/services` | 83.94 | 71.3 | 中等，仍有大模块缺口 |
| `server/services/ai` | **74.59** | **62.05** | ⭐ 最低，重点攻坚 |
| `server/services/external-feed` | **68.55** | **50.41** | ⭐ 低，分支缺口大 |
| `server/database` | 77.03 | 61.64 | 次优（typeorm-adapter 69.78%） |
| `server/utils` | 91.25 | 82.65 | 健康，不再优先 |
| `server/api/admin` | 72.56 | 58.49 | 单文件分散，收益低 |

### 2.2 高价值缺口模块清单（第八批候选）

| 模块 | 行数 | Stmts% | Branch% | Funcs% | 优先级 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `server/services/ai/text.ts` | 1202 | **55.64** | **48.99** | 96.66 | ⭐⭐⭐ 最大缺口 |
| `server/services/ai/tts.ts` | 771 | **59.84** | **46.03** | 69.56 | ⭐⭐⭐ 第二大缺口 |
| `server/services/external-feed/parser.ts` | 248 | **60.00** | **36.29** | 75.00 | ⭐⭐ 分支极低 |
| `server/services/external-feed/aggregator.ts` | 254 | **68.29** | **50.00** | 93.75 | ⭐⭐ |
| `server/services/category.ts` | 216 | **63.01** | **61.84** | 50.00 | ⭐ |
| `server/services/friend-link.ts` | 753 | 73.06 | 50.50 | 77.77 | 备选 |
| `server/services/notification.ts` | 703 | 70.10 | 56.59 | 68.18 | 备选 |
| `server/services/post-distribution.ts` | 713 | 75.31 | 65.47 | 93.33 | 备选 |
| `server/services/upload.ts` | 648 | 74.85 | 67.80 | 88.00 | 备选 |
| `server/services/ai/task-detail.ts` | 112 | **28.57** | 35.13 | 57.14 | 低收益（过小） |
| `server/services/external-feed/cache.ts` | 26 | 50.00 | 100 | 60.00 | 排除（<50 行） |

## 3. 第八批推荐目标（5 个）

1. **`server/services/ai/text.ts`**（1202 行，55.64%）— 单文件覆盖提升空间最大
2. **`server/services/ai/tts.ts`**（771 行，59.84%）— 第二大缺口
3. **`server/services/external-feed/parser.ts`**（248 行，60.00%，分支 36.29%）— 分支健康度最低
4. **`server/services/external-feed/aggregator.ts`**（254 行，68.29%，分支 50.00%）
5. **`server/services/category.ts`**（216 行，63.01%）— 中等模块

## 4. 覆盖提升预估

| 场景 | 目标覆盖提升 | 全仓 Statements 预估 |
| :--- | :--- | :--- |
| text.ts 55.64% → 80% | ~+292 行 | +0.60~0.70% |
| tts.ts 59.84% → 80% | ~+156 行 | +0.32~0.38% |
| parser.ts 60% → 90% | ~+74 行 | +0.15~0.18% |
| aggregator.ts 68.29% → 90% | ~+55 行 | +0.11~0.13% |
| category.ts 63.01% → 90% | ~+58 行 | +0.12~0.14% |
| **合计（text + tts）** | ~+448 行 | **+0.92~1.08%** |
| **合计（全部 5 个）** | ~+635 行 | **+1.30~1.50%** |

> **结论**: text.ts + tts.ts 两个大模块即可接近达标（80.48%），全部 5 个目标可确保通过。若时间预算不足，优先保障 text.ts + tts.ts + parser.ts 三个模块。

## 5. 测试有效性约束

- 不为冲数字做低价值铺量：每个新增用例必须覆盖失败路径 / 边界分支（如 AI Provider 降级、超时、限流、解析异常、空结果）。
- 复用既有测试基座（`server/services/ai/*.test.ts` 已有基础），在现有文件上补充，不新建重复基座。
- 全仓 `pnpm test:coverage` 运行约 8-9 分钟（CI 实测 514s），本地验证用定向 subset（3-5 文件），最终以 CI 为准。

## 6. 验收对照

- [ ] 全仓 Statements ≥80.48%（CI 验证）
- [ ] `pnpm typecheck` + `pnpm lint` 通过
- [ ] 无低价值铺量断言（Review Gate 复核）
