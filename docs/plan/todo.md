# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 当前进行中阶段

### 第七十九阶段：质量稳定性与门禁可信度（筹备中，2026-11-18 立项）

**阶段目标**: 收口测试 flake 根因与门禁信号可信度——修复管理端「交互后立即断言」的时序抖动、把构建产物尺寸探针与依赖台账复核接入日常巡检、让 parity 允许清单可脚本化清零，并顺带完成覆盖率第二十批与依赖 PR 处置。

**准入结论**: 用户于 2026-11-18 在候选页确认「方案 A」6 条组合，容量 6 条；ROI 均值 `2.21`（flake 收敛 1.67 / 探针常驻 3.00 / reviewBy 巡检 2.67 / 依赖 PR 2.00 / 覆盖率第二十批 1.60 / parity 清零脚本化 2.33），为当轮三方案最高；未选方案 B（债务收口 II，1.64）与 C（功能与体验，1.12）。

**阶段基线**: 同源 statements `85.99%`（33,378 / 38,812，631 文件 / 5,893 例通过 + 1 跳过）；`duplicate-code` 0.38%（43 clones / 665 行）；i18n missing 0 / duplicates 64 组（预算 74）；字号 457 声明（token 139 / 口径内待替换 135 / 非字阶 149 / scss 变量 34）；`coreEntryJs` 281.07KB / 335KB、`keyCss` 59.44KB / 62KB；依赖台账 6 条豁免（均 `reviewBy 2027-05-14`）；open PR 仅 #1068（`sanitize-html` patch），其余依赖 PR 已于 2026-11-18 上午被 Mergify 自动合并（含 `@vite-pwa/nuxt` 2.0.1 major）。

**排程与移出顺序**: `1 → 2 → 3 → 5 → 6 → 4`；超时按 `4 → 6 → 5` 移出。

- [x] **1. 测试 flake 收敛与门禁可信度（P1 修复型）**: 修复管理端 6 处「交互后立即断言」时序 flake（`admin/users` 的 `@page` 与 `onFilterChange`、`snippets/snippet-edit-dialog` 保存载荷、`external-links` 统计弹窗、`commercial-settings` 脏状态与保存、`agreements-settings` 翻译模式切换、`app-uploader` file input），统一「等待可观测状态」口径并评估 `networkidle` 与重试策略。
    - **验收标准**: 6 个已知用例各连跑 20 次 0 失败；`pnpm test:coverage` 连跑 3 次全绿无 retry；`pnpm regression:phase-close` 本地一次 Pass（3001 占用时以 `E2E_PORT=3011` 跑通并登记）；给出 backlog「`networkidle` 依赖外网可达性」待跟踪项的处置结论（上收或明确保留）。
    - **非目标**: 不改业务逻辑与组件契约；不降低或删除断言；不放宽覆盖率阈值；不新增 `.skip` / `.only`；不改 CI required 口径；不用 `waitForTimeout` 换抖动。
    - **验证 / 证据**: V0 + V1 + V2 + RG；连跑日志与 flake 前后对比落 `artifacts/review-gate/`。
    - **回滚边界**: 按测试文件独立 revert。

- [x] **2. 构建产物尺寸探针常驻（P2）**: 新增 `scripts/testing/probe-build-geometry.mjs`（`.output` 产物 + `getComputedStyle` 实测几何，清单可配置）与 `package.json` 的 `probe:build-geometry` 稳定入口，接入 `regression:weekly` 的 `required: false`，同步 `scripts/README.md`，补三类路径单测。
    - **验收标准**: `pnpm probe:build-geometry --dry-run` 与真实产物跑均通过；weekly dry-run 清单含该步骤；AppAvatar 三档实测 64 / 48 / 32px 复现；单测覆盖解析 / 缺元素 / 失败路径。
    - **非目标**: 不引入新浏览器依赖；不把探针升为阻断门禁；不扩成全站视觉回归。
    - **验证 / 证据**: V0 + V1 + V2 + RG；探针 JSON 落 `artifacts/review-gate/`。
    - **回滚边界**: 脚本、调度与 README 同批 revert。

- [x] **3. `reviewBy` 复核日期接入日常巡检（P2）**: 把 `evaluateAllowlistReviewDates` 接入 `security:audit-deps:daily` 的 summary / JSON 与 `security:alerts` 输出行（只增可见性，不改 severity 与退出码语义），补四类分桶测试。
    - **验收标准**: daily 产物含 review 段；alerts 打印过期行且退出码不变；单测覆盖过期 / 即将到期 / 计划内 / 未登记。
    - **非目标**: 不改 release 门禁判红逻辑；不让 daily / alerts 因台账到期整体变红；不改 `readAllowlist` 既有字段校验。
    - **验证 / 证据**: V0 + V1 + V2 + RG；daily 与 alerts 产物落 `artifacts/security/`。
    - **回滚边界**: 两个脚本独立 revert。

- [x] **4. parity 允许清单清零脚本化（P3）**: 新增 `scripts/testing/prune-parity-allowlist.mjs`（按 testName 清零 `parity-budget.json` 的 `allowlist`，保留 note 历史），文档化「CI 重采 → prune → 复跑 parity」流程并补单测。
    - **验收标准**: `--dry-run` 输出待清零条目；单测覆盖命中 / 未命中 / 幂等；文档含流程与失败回退，并显式区分「重采后的绿」与「预算内吸收的绿」（后者须登记到偏差处置表）。
    - **非目标**: 不自动重采参考态；不改预算阈值；不删 note 历史校准记录。
    - **验证 / 证据**: V0 + V1 + RG；dry-run 输出落 `artifacts/review-gate/`。
    - **回滚边界**: 脚本与文档独立 revert。

- [x] **5. 覆盖率第二十批（P2）**: 取 `scripts/governance/check-script-governance.mjs` 与 `scripts/testing/capture-visual-reference.mjs` 的未闭合部分（必要时换入 `run-periodic-regression.mjs`），目标同源 `+0.3pp` 或模块级 `+15pp / ≥85%`。
    - **验收标准**: 干净全量跑基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因记录。
    - **非目标**: 不为凑数测模板分支；不重构被测脚本公开行为；不新增测试依赖；`admin-taxonomy-page.vue` 须先评估拆分，不在本批硬做。
    - **验证 / 证据**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [x] **6. 依赖 PR 处置与已合并 major 的追溯评估（P2）**: 处置唯一 open PR #1068（`sanitize-html` patch）并在合并后本地 `pnpm i --frozen-lockfile` 校验锁文件；对已被 Mergify 自动合并的 `@vite-pwa/nuxt` 2.0.1（`cedcc241`）做追溯评估（PWA 配置兼容、Workbox 7 差异、离线与 SW 更新语义、构建产物与 SW 注册实测），给出保留 / 回滚结论与回滚步骤；把「连续 rebase 自动合并 → 坏锁文件 + major 静默落地」写入 backlog #10 的系统性解法候选。
    - **验收标准**: #1068 已合并、锁文件 `--frozen-lockfile` 本地通过且 CI 绿；2.0.1 追溯评估文档含影响面 / 实测 / 保留或回滚结论与回滚步骤；`security:audit-deps` 与 `security:alerts` 仍 Pass。
    - **非目标**: 不在本阶段新增 major 迁移（已落地的 2.0.1 只做追溯评估与去留结论）；不改 PWA 运行时策略；不改告警 severity 口径；不直接改 `.github/mergify.yml`。
    - **验证 / 证据**: V0 + V1 + RG；评估文档落 `docs/design/governance/`，PR 结论落 Review Gate 证据。
    - **回滚边界**: 每个依赖升级独立 revert；评估文档独立。

> 阶段收口门禁: `pnpm regression:phase-close`；任何条目开工前先确认工作区干净并拉取远端。

> 上一阶段归档：第七十八阶段「质量门禁与债务收口」已完成全部 6 条条目并归档（2026-11-16 立项、2026-11-18 收口），正文见 [roadmap 归档分片](./archive/roadmap-phases-78.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十八阶段归档结论最近归档阶段)。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
