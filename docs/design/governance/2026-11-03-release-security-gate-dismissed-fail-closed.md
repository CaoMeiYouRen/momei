# 2026-11-03 发布前安全门禁 dismissed 与 fail-closed 对齐

> 来源：上游 `cmyr-skills-agents/docs/proposals/2026-11-02-release-security-gate.md` 与 `standards/gates.md` §2。
> 定位：本文件记录为什么改、改了什么、影响面与复查条件；规范正文只保留当前判定口径，见 [安全开发规范 §5.3](../../standards/security.md)。

## 1. 背景与实测缺口

momei 已有发布前安全门禁（`pnpm security:alerts` + `pnpm security:audit-deps`），并已接入 `release.yml` 与 `release:check:full`。对照上游政策，实测存在三处行为缺口：

| 缺口 | 实测证据 | 风险 |
|:---|:---|:---|
| 只读 `open`，不读 `dismissed` | `fetchGitHubApiPage` 固定 `state=open` | critical 被 dismiss 后仍可能发布；dismissed high 没有 false-positive 校验 |
| Code Scanning 源缺失时 fail-open | `gateConclusion` 只统计告警，不统计 `sourceStatuses` | 无 token / 权限不足时显示 Pass，等于把“没扫到”当成“没告警” |
| 台账字段不足、无自动到期 | `security-alert-exceptions.json` 只有 `source` / `alertNumber` / `classification` / `reason` / `temporaryException` | 无法机器判断 `category` / `severity` / `review` / `location`；过期条目不会自动失效 |

同时，`pnpm security:alerts` 实测已因 open high Code Scanning #44（`scripts/governance/count-primevue-usage.mjs`）返回 `Reject`，说明既有 open 阻断链路有效；本次不放松该链路。

## 2. 决策

1. **采纳**上游 `release-security-gate` 的核心政策：同时读取 `open` 与 `dismissed`；critical dismissed 阻断；dismissed high 仅 `false-positive` 可登记；数据源缺口 fail-closed。
2. **保留** momei 更严格的既有规则：critical 完全不可豁免、双台账分工、`tests/` 路径 Code Scanning 范围外；仅缺少 Dependabot token 时回退 `pnpm audit` 并标记 `fallback`，权限 / 网络 / 响应异常仍按失败处理。
3. **过渡一个发布周期**：`security:alerts` 追加 `--transition-mode`，只对 dismissed / fail-closed 新检查报告，不阻断；open 告警仍按原行为阻断。一个发布周期后移除该参数。
4. **不采纳**上游 `standards/` 骨架正文；`AGENTS.md` §2 与 §6.3 已覆盖等价规则，避免第二权威。

## 3. 变更清单

| 文件 | 变更 |
|:---|:---|
| `scripts/security/security-alert-gate-policy.mjs` | 新增：严重级归一、告警分类、台账 v2 归一化与到期判断、门禁判定 |
| `scripts/security/security-alert-gate-shared.mjs` | 双状态拉取；部分失败保留已读取告警；非数组 / 缺失 sourceStatuses fail-closed；source fail-closed；transition 输出 |
| `scripts/security/check-github-security-alerts.mjs` | 传递 source 状态、计算 `effectiveBlocking`、输出 transition findings 与 warnings |
| `package.json` | `security:alerts` 增加 `--transition-mode` |
| `.github/security/security-alert-exceptions.json` | 迁移到 v2 字段；保留 mjml / quill 并标记已到期；移除已 fixed 且 medium 的 code-scanning 30 / 31 |
| `docs/standards/security.md` §5.3 | 更新扫描范围、dismissed 语义、台账字段、fail-closed、过渡模式 |
| `scripts/governance/count-primevue-usage.mjs` | 修复 Code Scanning #44：HTML 注释闭合符同时接受 `-->` 与 `--!>` |
| `tests/scripts/check-github-security-alerts.test.ts` | 补 dismissed / fail-closed / 双状态拉取 / 过期台账用例 |

## 4. 影响面与风险

- **发布门禁**：open critical / high 的阻断行为不变；dismissed #43（`scripts/docs/check-doc-markers.mjs`，`won't fix`）在过渡期只报告，切阻断后会成为新的阻断点，需在过渡期内修复或补 `false-positive` 依据。
- **部分失败**：某个 state 或分页失败时保留已成功读取的告警，并同时把数据源标记为缺口；transition 模式只降级数据源缺口，不放松已读取的 open 告警。
- **台账强校验**：非 legacy 条目必须提供 `expiresAt`、`tracking`、`target`；Code Scanning 另需 `location`；`target` / `location` / 原 dismiss 原因与告警不匹配时不放行。
- **本地执行**：`security:alerts` 需要 GitHub token；无 token 时 Code Scanning 会进入 transition warning，切阻断后则直接失败。CI 已有 `security-events: read`，不受影响。
- **台账**：mjml / quill 的 `expiresAt` 已过期，每次门禁会输出 warning；这是“标记失效而非删除”的保留方式，需在后续复核时决定修复、替换或清理。
- **Dependabot 降级**：仅缺少读取 token 时回退 `pnpm audit`，状态标记为 `fallback` 并输出 warning；权限、网络与响应异常保留 failure，切阻断后会阻塞发布。

## 5. 复查与退出条件

- 过渡期长度：一个发布周期（下一次正式发布完成后）。
- 退出动作：移除 `package.json` 中 `security:alerts` 的 `--transition-mode`，并在同一提交中更新 [安全开发规范 §5.3](../../standards/security.md)。
- 切阻断前必须处理：dismissed #43 的 `won't fix` 归类（修复或补 false-positive 依据）；确认 mjml / quill 过期条目已复核。
- 若 Code Scanning #44 修复后 CI 复扫未关闭，按实际告警继续修复，不使用豁免绕过。
