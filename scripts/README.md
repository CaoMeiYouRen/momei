# Scripts Directory Guide

本目录用于维护项目级自动化脚本。长期脚本按领域分组，默认优先采用 Node ESM `.mjs`；仅服务本地工具链或工作树维护的 PowerShell 脚本会显式标记为“本地手工脚本”，不视为常规发布入口。

## 高频入口速查

| 领域 | 推荐入口 | 主要输入 | 标准输出 | 风险边界 / 备注 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `regression` | `pnpm regression:weekly` / `pnpm regression:pre-release` / `pnpm regression:phase-close` | 固定 cadence profile；可选 `--mode=warn|error`、`--dry-run` | 周级 / 发版前 / 阶段收口前的统一执行摘要；`artifacts/review-gate/` 下的 Markdown + JSON 证据 | `phase-close` 会把回归日志窗口超限升级为 blocker；所有结果仍需回写 `docs/plan/regression-log.md` | 正式入口 |
| `release` | `pnpm release:check` / `pnpm release:check:full` | 可选 `--skip-test`、`--skip-e2e`、`--mode=warn|error` | 控制台验证摘要；`artifacts/release/` 下的发布前证据 | 默认会跑 lint、typecheck、安全 / 文档检查；`full` 会升级补跑 Vitest 与 E2E，避免在未评估预算时直接使用 | 正式入口 |
| `review-gate` | `pnpm review-gate:generate` / `pnpm review-gate:generate:check` / `pnpm duplicate-code:check` | 可选 `--run-checks`、`--scope=<change>`、`--mode=warn|error` | Review Gate 证据 Markdown / JSON；重复代码审计产物 | 以证据生成和只读审计为主；`generate:check` 会主动拉起更多校验，适合阶段收口或发版前 | 正式入口 |
| `security` | `pnpm security:audit-deps` / `pnpm security:audit-deps:daily` / `pnpm security:alerts` | allowlist / exceptions、最小严重级别、可选快照输入 | High+ 风险结论；JSON / Markdown 证据落盘 | `audit-deps` 默认按 high+ 阻断；`audit-deps:daily` 产出每日结构化摘要并供调度入口消费；本地会尝试补装 `.env` 中的 token，但不会覆盖已显式传入变量 | 正式入口 |
| `testing` | `pnpm test:e2e:critical` / `pnpm test:e2e:review-gate --scope=<change>` / `pnpm test:e2e` | Playwright 额外参数、scope、可选 `--keep-auth-state` | Playwright 控制台结果；Review Gate run 目录下的 `evidence.md`、`manifest.json`、HTML 报告与失败附件 | 先跑 `critical`，只有范围扩大时才升级到全量；`review-gate` 会清理过期登录态并落盘结构化证据 | 正式入口 |
| `docs` | `pnpm docs:check:i18n` / `pnpm docs:check:source-of-truth` | 无；默认扫描 `docs/` 与翻译目录 | 重复翻译页 / 事实源漂移结论 | 只读检查，不修改文档；适合文档 PR 和阶段归档前的最低门禁 | 正式入口 |
| `i18n` | `pnpm i18n:audit` / `pnpm i18n:check-sync` | 可选 CLI 参数或手工指定 locale 文件 | locale key 缺口、同步偏差、拆分治理依据 | 审计类入口默认只读；`split-locale-files.mjs` 属于治理型脚本，应按专项文档手工执行，不作为日常入口 | 正式入口 |
| `setup` | `pnpm setup:ai` / `pnpm web-push:generate-vapid` | worktree / 软链接上下文；可选 `--subject`、`--json` | AI 工作树链接同步结果；VAPID 公私钥 | 会产生本地副作用；执行前确认目标环境与路径 | 正式入口 |
| `hooks` | `scripts/hooks/*.ps1` | 当前机器的 Hook 宿主、Git / pnpm 环境 | 本地日志、lint 副作用、会话摘要 | 仅限本地手工脚本，不纳入 CI / 团队通用入口；若后续退役应优先清理 | 本地实验 |

## 目录索引

| 目录 | 主要脚本 | 调用入口 | 副作用范围 | 当前结论 |
| :--- | :--- | :--- | :--- | :--- |
| `scripts/regression/` | `run-periodic-regression.mjs` | `pnpm regression:weekly`、`pnpm regression:pre-release`、`pnpm regression:phase-close` | 按 profile 编排固定回归组合，读取 `docs/plan/regression-log.md` 窗口健康度，并生成 Review Gate 摘要 | 保留 |
| `scripts/ai/` | `check-governance.mjs` | `pnpm ai:check` | 只读体检 `.github/`、`.claude/`、skills / agents 镜像与治理状态 | 保留 |
| `scripts/release/` | `pre-release-check.mjs` | `pnpm release:check`、`pnpm release:check:full` | 汇总 lint、typecheck、安全、文档与按需测试的发布前门禁，并落盘证据 | 保留 |
| `scripts/review-gate/` | `generate-evidence.mjs`、`check-duplicate-code.mjs` | `pnpm review-gate:generate`、`pnpm review-gate:generate:check`、`pnpm duplicate-code:check` | 生成 Review Gate 证据，或对重复代码输出 JSON / Markdown 审计结果 | 保留 |
| `scripts/security/` | `check-dependency-risk.mjs`、`run-daily-dependency-audit.mjs`、`check-github-security-alerts.mjs` | `pnpm security:audit-deps`、`pnpm security:audit-deps:daily`、`pnpm security:alerts`、`.github/workflows/release.yml`、`.github/workflows/dependency-risk-daily.yml` | 读取 `pnpm audit` 官方审计结果并按白名单执行 high+ 发版门禁；每日巡检包装脚本会产出三态摘要并供调度入口上传 artifact / 触发告警；优先接入 GitHub Dependabot / Code Scanning 告警并在权限不足时显式回退 | 保留 |
| `scripts/docs/` | `check-i18n-duplicates.mjs`、`check-source-of-truth.mjs` | `pnpm docs:check:i18n`、`pnpm docs:check:source-of-truth` | 只读检查文档重复、翻译同步与事实源一致性 | 保留 |
| `scripts/i18n/` | `audit-locale-keys.mjs`、`split-locale-files.mjs` | `pnpm i18n:audit`；设计 / 翻译治理文档中的手工命令 | 审计 locale key、拆分翻译文件 | 保留 |
| `scripts/testing/` | `run-e2e.mjs`、`run-e2e-critical.mjs`、`run-review-gate-ui-baseline.mjs` | `pnpm test:e2e`、`pnpm test:e2e:critical`、`pnpm test:e2e:review-gate` | 检查 `.output` 新鲜度、执行 Playwright 最小关键路径基线，并在 Review Gate 场景下沉淀按运行目录隔离的日志 / 报告 / 失败附件 | 保留 |
| `scripts/perf/` | `check-bundle-budget.mjs` | `pnpm test:perf:budget`、`pnpm test:perf:budget:strict`、`.github/workflows/test.yml` | 读取 Lighthouse / bundle 输出并给出预算结论 | 保留 |
| `scripts/setup/` | `generate-web-push-vapid.mjs`、`setup-ai.mjs` | `pnpm web-push:generate-vapid`；`pnpm setup:ai` | 生成 VAPID 密钥；批量同步 worktree 内 AI 目录链接 | `generate-web-push-vapid.mjs` 保留；`setup-ai.mjs` 作为跨平台正式入口 |
| `scripts/shared/` | `cli.mjs` | 被 `security/`、`testing/`、`review-gate/`、`release/`、`perf/`、`i18n/`、`setup/` 等脚本内部复用 | 提供公共 CLI helper，如直跑判断、`argv` 切片、声明式 flag / `--key=value` 白名单解析、枚举校验；不直接暴露为包管理器入口 | 新增保留 |
| `scripts/hooks/` | `pre-tool.ps1`、`post-tool.ps1`、`session-end.ps1` | 无 `package.json` 或 CI 稳定入口；仅面向本地 Copilot / Claude Hook 实验 | 拦截工具调用、尝试自动 lint、记录会话摘要 | 保留为本地手工脚本，不纳入常规团队入口 |

## 入口说明

### 包管理器入口

以下脚本已有稳定入口，可直接通过 `package.json` 运行：

```bash
pnpm ai:check
pnpm regression:weekly
pnpm regression:pre-release
pnpm regression:phase-close
pnpm security:audit-deps
pnpm security:audit-deps:daily
pnpm security:alerts
pnpm docs:check:i18n
pnpm docs:check:source-of-truth
pnpm i18n:audit
pnpm test:e2e
pnpm test:e2e:critical
pnpm test:e2e:review-gate --scope=auth-session
pnpm web-push:generate-vapid
pnpm setup:ai
pnpm test:perf:budget
pnpm test:perf:budget:strict
```

其中 `pnpm test:e2e:review-gate` 用于需要提交 Review Gate 证据的高频 UI 真实环境回归：

- 运行前会删除过期的 `tests/e2e/.auth/admin.json`，再由 `tests/e2e/global-setup.ts` 重新生成当前 run 使用的登录态，避免把陈旧认证态带入基线。
- 固定执行 `pnpm test:e2e:critical` 覆盖的两段式矩阵，并把每次运行的原始日志、HTML 报告、失败截图 / trace 附件收敛到 `artifacts/testing/ui-regression/<timestamp>-<scope>/`。
- 该目录下的规范产物固定为 `evidence.md`、`manifest.json`、`playwright.log`、`playwright-report/` 与 `test-results/`；`manifest.json` 记录本次 run 的环境准备、命令、artifact 路径与失败归因分类，便于 Review Gate 或回归日志直接引用。
- 失败归因顺序统一为“服务启动 / 构建产物 -> 认证态 / 种子数据 -> 具体场景断言”；需要更大范围验证时，再从该基线升级到定向或全量 `pnpm test:e2e`。

补充说明：本地直接运行 `pnpm security:audit-deps`、`pnpm security:audit-deps:daily` 或 `pnpm security:alerts` 时，若仓库根目录存在 `.env`，脚本会先尝试装载其中尚未出现在当前进程环境中的变量（例如 `SECURITY_ALERTS_TOKEN`、`GITHUB_TOKEN`、`GH_TOKEN`），但不会覆盖已显式传入的环境变量。

`pnpm security:audit-deps:daily` 会输出两份结构化结果：

- JSON 摘要：用于 workflow 解析三类结论（无高危风险 / 发现可修复风险 / 审计执行失败）并决定是否告警。
- Markdown 摘要：用于写入 GitHub Actions Job Summary，并作为 artifact 一部分保留近线追溯记录。

`.github/workflows/dependency-risk-daily.yml` 则负责每天触发一次该脚本，并执行以下收口动作：

- 上传每日审计 artifact，默认保留 30 天以便追溯。
- 仅当发现 high+ 风险或审计失败时，才尝试创建 / 更新 GitHub issue 作为最小可用告警入口；同一风险会按风险指纹复用既有 issue，不重复新建，clean 场景也不会触碰 issue，避免无效膨胀。
- 若 issue 通知不可用，则退回到 failed workflow + artifact 作为降级告警，不静默吞掉异常。

`pnpm regression:weekly`、`pnpm regression:pre-release` 与 `pnpm regression:phase-close` 则负责把既有周期性回归规范上收为三条固定节奏：

- `weekly` 固定覆盖 coverage、依赖安全、文档事实源 / i18n 检查与重复代码基线。
- `pre-release` 固定覆盖完整发布前校验、文档 i18n 检查、性能预算与重复代码复核。
- `phase-close` 在 `pre-release` 基础上补强 coverage、严格重复代码检查与 Review Gate 证据生成；若活动回归日志超过 `400` 行或 `8` 条记录，脚本会把“先滚动归档再收口”升级为 blocker。

### 工作流入口

- `.github/workflows/test.yml` 会调用 `scripts/perf/check-bundle-budget.mjs`。
- `.github/workflows/release.yml` 会调用 `scripts/security/check-dependency-risk.mjs` 对 high+ 依赖风险执行发版门禁。
- 翻译治理和设计文档会引用 `scripts/i18n/audit-locale-keys.mjs` 与 `scripts/i18n/split-locale-files.mjs`。

### 本地手工脚本

以下脚本当前没有稳定团队入口，默认只在特定本地环境中手工执行：

- `scripts/hooks/pre-tool.ps1`
- `scripts/hooks/post-tool.ps1`
- `scripts/hooks/session-end.ps1`

这些脚本的共同特征：

- 依赖当前机器上的 Git / pnpm / Hook 宿主环境。
- 可能创建软链接、调用 lint、写入 `logs/`，具备本地副作用。
- 不应视为 CI、发版或跨平台团队常规入口。

## 回归与治理结论（2026-04-01）

- 保留：所有 `.mjs` 长期脚本均已有 `package.json`、工作流或治理文档引用。
- 保留：`scripts/release/pre-release-check.mjs` 继续作为 release 前统一门禁入口，优先承接发布前的最低验证矩阵，而不是让调用方各自拼装 lint / test 命令。
- 保留：`scripts/review-gate/generate-evidence.mjs` 与 `scripts/review-gate/check-duplicate-code.mjs` 继续承担 Review Gate 证据生成与重复代码审计，不与 release 或 testing 入口混用。
- 保留：`scripts/security/check-dependency-risk.mjs` 作为 release 前依赖风险门禁入口，配套白名单基线位于 `.github/security/dependency-risk-allowlist.json`。
- 保留：`scripts/security/check-github-security-alerts.mjs` 作为安全告警闭环入口，配套延期基线位于 `.github/security/security-alert-exceptions.json`。
- 保留：`scripts/testing/run-review-gate-ui-baseline.mjs` 作为 UI 真实环境回归的 Review Gate 正式入口，按运行目录落盘证据，避免口头描述替代浏览器证据。
- 保留：`scripts/shared/cli.mjs` 作为第三轮公共 helper，已进一步收敛声明式 flag / `--key=value` 白名单解析与枚举校验，减少各脚本重复的 `startsWith('--x=')` 分支和 `mode` 手写校验。
- 保留：`scripts/setup/setup-ai.mjs` 作为 worktree 辅助工具的跨平台正式入口。
- 保留：`scripts/hooks/*.ps1` 作为本地 Hook 实验脚本；当前不并入团队正式流程。
- 合并：本轮未发现需要立即合并的重复长期脚本。
- 合并：第三轮已把 release、review-gate、security、testing、perf、i18n、setup 中的高频 parser 收敛到共享声明式 helper；各脚本只保留默认值、字段后处理和业务语义判断。
- 删除：本轮未发现需要立即删除的受版本控制脚本；后续若本地 Hook 方案退役，应优先清理 `scripts/hooks/`。
- 废弃标记：当前无受版本控制的长期脚本处于“正式废弃待删”状态；`scripts/hooks/` 仅标记为本地实验，不等同于废弃正式入口。

## 维护要求

- 新增长期脚本前先检查本目录、`package.json` 和工作流是否已有等价入口。
- 若脚本改变团队常规流程，必须同步更新 `package.json`、工作流或相关文档。
- 本地手工脚本必须明确平台限制和副作用，避免被误认为通用入口。
- 公共 helper 优先保持最小粒度；只有当至少两个正式入口共享完全一致的 CLI / IO 行为时，才继续向 `scripts/shared/` 抽取。
