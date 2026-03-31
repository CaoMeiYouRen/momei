# Scripts Directory Guide

本目录用于维护项目级自动化脚本。长期脚本按领域分组，默认优先采用 Node ESM `.mjs`；仅服务本地工具链或工作树维护的 PowerShell 脚本会显式标记为“本地手工脚本”，不视为常规发布入口。

## 目录索引

| 目录 | 主要脚本 | 调用入口 | 副作用范围 | 当前结论 |
| :--- | :--- | :--- | :--- | :--- |
| `scripts/ai/` | `check-governance.mjs` | `pnpm ai:check` | 只读体检 `.github/`、`.claude/`、skills / agents 镜像与治理状态 | 保留 |
| `scripts/security/` | `check-dependency-risk.mjs`、`check-github-security-alerts.mjs` | `pnpm security:audit-deps`、`pnpm security:alerts`、`.github/workflows/release.yml` | 读取 `pnpm audit` 官方审计结果并按白名单执行 high+ 发版门禁；优先接入 GitHub Dependabot / Code Scanning 告警并在权限不足时显式回退 | 保留 |
| `scripts/docs/` | `check-i18n-duplicates.mjs`、`check-source-of-truth.mjs` | `pnpm docs:check:i18n`、`pnpm docs:check:source-of-truth` | 只读检查文档重复、翻译同步与事实源一致性 | 保留 |
| `scripts/i18n/` | `audit-locale-keys.mjs`、`split-locale-files.mjs` | `pnpm i18n:audit`；设计 / 翻译治理文档中的手工命令 | 审计 locale key、拆分翻译文件 | 保留 |
| `scripts/perf/` | `check-bundle-budget.mjs` | `pnpm test:perf:budget`、`pnpm test:perf:budget:strict`、`.github/workflows/test.yml` | 读取 Lighthouse / bundle 输出并给出预算结论 | 保留 |
| `scripts/setup/` | `generate-web-push-vapid.mjs`、`setup-ai.mjs` | `pnpm web-push:generate-vapid`；`pnpm setup:ai` | 生成 VAPID 密钥；批量同步 worktree 内 AI 目录链接 | `generate-web-push-vapid.mjs` 保留；`setup-ai.mjs` 作为跨平台正式入口 |
| `scripts/hooks/` | `pre-tool.ps1`、`post-tool.ps1`、`session-end.ps1` | 无 `package.json` 或 CI 稳定入口；仅面向本地 Copilot / Claude Hook 实验 | 拦截工具调用、尝试自动 lint、记录会话摘要 | 保留为本地手工脚本，不纳入常规团队入口 |

## 入口说明

### 包管理器入口

以下脚本已有稳定入口，可直接通过 `package.json` 运行：

```bash
pnpm ai:check
pnpm security:audit-deps
pnpm security:alerts
pnpm docs:check:i18n
pnpm docs:check:source-of-truth
pnpm i18n:audit
pnpm web-push:generate-vapid
pnpm setup:ai
pnpm test:perf:budget
pnpm test:perf:budget:strict
```

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

## 回归结论（2026-03-21）

- 保留：所有 `.mjs` 长期脚本均已有 `package.json`、工作流或治理文档引用。
- 保留：`scripts/security/check-dependency-risk.mjs` 作为 release 前依赖风险门禁入口，配套白名单基线位于 `.github/security/dependency-risk-allowlist.json`。
- 保留：`scripts/security/check-github-security-alerts.mjs` 作为安全告警闭环入口，配套延期基线位于 `.github/security/security-alert-exceptions.json`。
- 保留：`scripts/setup/setup-ai.mjs` 作为 worktree 辅助工具的跨平台正式入口。
- 保留：`scripts/hooks/*.ps1` 作为本地 Hook 实验脚本；当前不并入团队正式流程。
- 合并：本轮未发现需要立即合并的重复长期脚本。
- 删除：本轮未发现需要立即删除的受版本控制脚本；后续若本地 Hook 方案退役，应优先清理 `scripts/hooks/`。

## 维护要求

- 新增长期脚本前先检查本目录、`package.json` 和工作流是否已有等价入口。
- 若脚本改变团队常规流程，必须同步更新 `package.json`、工作流或相关文档。
- 本地手工脚本必须明确平台限制和副作用，避免被误认为通用入口。
