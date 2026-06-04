# Harness Engineering Phase B：PostToolUse 质量校验 + Stop 门禁

**时间表**: 2026-06-05 ~ 约 1 - 2 天
**来源**: [harness-engineering-adoption.md](./harness-engineering-adoption.md) Phase A 的延续，对应原文档 §4.3「建议的接入架构」中 Phase B 的正式启动。

## 背景与痛点

Phase 42 实际执行中暴露了一个系统性问题：每次大改 session 结束后，lint/typecheck 错误累积到下一个 session 才被发现和修复，且缺乏自动化的改后校验机制。当前 `.session/` 基础设施已经能追踪 `verification_state` 的变化（编辑后自动标记 `stale`），但没有在工具执行后**自动触发校验**，也没有在 session 结束前**强制检查验证状态**。

Phase B 的目标不是"等 agent 自己想起来跑 lint"，而是把关键质量动作绑定到 hooks 生命周期事件上，实现**自动触发、可见状态、可选阻断**的三层递进约束。

## 执行范围

1. **PostToolUse 改后自动校验**：在 Claude Code / Copilot / OpenCode 的 PostToolUse 事件中，检测到代码文件编辑后，自动执行轻量 lint + typecheck，将结果写入 `.session/runtime-state.json` 的 `last_verification`。
2. **Stop / sessionEnd 前门禁提醒**：在 session 结束前检查 `verification_state`，若为 `stale` 则注入阻断性提示要求先补验证。
3. **共享脚本驱动**：复用 `scripts/ai-hooks/session-governance-shared.mjs`，新增 `--event=post-verify` 轻量校验入口。

## 非目标

- 不对每次编辑做硬阻断（会导致开发流程频繁中断）。
- 不替换现有的 husky pre-commit 流程（`lint-staged` + `commitlint`）——hooks 是 husky 的上游补充，不是替代。
- 不在本轮做跨文件语义级 review（属于 future Phase C agent hook 范围）。

## 方案设计

### 1. 质量校验状态机

```
编辑文件 → verification_state: stale
PostToolUse 自动跑 lint → last_verification.lint: {result: 'pass|fail'}
PostToolUse 自动跑 typecheck → last_verification.typecheck: {result: 'pass|fail'}
全部 pass → verification_state: verified
有 fail → verification_state: stale（+ reason 记录失败命令）
Stop/sessionEnd 检测 → 若 stale 则提醒
```

### 2. 共享脚本扩展

在 `scripts/ai-hooks/session-governance-shared.mjs` 中新增 `post-verify` 事件处理：

```javascript
if (eventName === 'post-verify') {
    // 检测到代码编辑 → 运行 lint + typecheck
    // 结果写入 runtimeState.last_verification
    // 全部 pass → verification_state = 'verified'
    // 有 fail → verification_state = 'stale', reason = 失败命令
}
```

新增 `--event=post-verify` 命令入口：

```bash
node scripts/ai-hooks/session-governance.mjs --platform=manual --event=post-verify
```

脚本内部逻辑：
1. 读取 `.session/runtime-state.json`，判断 `verification_state.status === 'stale'` 且 `reason` 为编辑工具
2. 若 stale：执行 `pnpm exec eslint <changed-files> --quiet` + `pnpm run typecheck`
3. 更新 `verification_state` 和 `last_verification`
4. 输出结果摘要（供 hook 日志或 agent 上下文回灌）

### 3. 平台 hooks 配置

**Claude Code** (`.claude/settings.json`)：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "handler": {
          "type": "command",
          "command": "node scripts/ai-hooks/session-governance.mjs --platform=claude --event=post-verify",
          "timeoutSec": 60
        }
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "handler": {
          "type": "command",
          "command": "node scripts/ai-hooks/session-governance.mjs --platform=claude --event=pre-stop-check",
          "timeoutSec": 10
        }
      }
    ]
  }
}
```

**GitHub Copilot** (`.github/hooks/momei.json`)：

在现有 hooks 基础上新增 `postVerify` 事件：

```json
{
  "postToolUse": [
    {
      "type": "command",
      "bash": "node scripts/ai-hooks/session-governance.mjs --platform=copilot --event=post-verify",
      "powershell": "node scripts/ai-hooks/session-governance.mjs --platform=copilot --event=post-verify",
      "command": "node scripts/ai-hooks/session-governance.mjs --platform=copilot --event=post-verify",
      "timeoutSec": 60
    }
  ]
}
```

**OpenCode** (`.opencode/plugins/session-governance.js`)：

在现有 `tool.execute.after` 处理器中补充 `post-verify` 逻辑。

### 4. 阻断力度分级

| 层级 | 触发条件 | 行为 | 状态 |
|---|---|---|---|
| **记录层** | 每次编辑后 | 自动运行 lint/typecheck，记录结果到 `runtime-state.json` | 🟢 本次实施 |
| **提醒层** | Stop/sessionEnd 前 `verification_state = stale` | 注入上下文提醒："当前有未验证的改动，建议先运行 `pnpm lint && pnpm typecheck`" | 🟢 本次实施 |
| **阻断层** | 连续 3 次 stale 且未手动验证 | `agentStop` 返回 block，要求先补验证再结束 | 🟡 观察后评估 |

### 5. 与现有 husky 的关系

```
hooks (AI 会话内)            husky (git 提交前)
─────────────────            ─────────────────
PostToolUse → lint/typecheck  pre-commit → lint-staged
Stop → 门禁提醒               commit-msg → commitlint
```

两层不冲突、不重复：hooks 负责 AI 会话内的**实时校验**，husky 负责提交前的**最终拦截**。

## 实施清单

| 步骤 | 文件 | 操作 |
|---|---|---|
| 1 | `scripts/ai-hooks/session-governance-shared.mjs` | 新增 `post-verify` 事件处理 |
| 2 | `.claude/settings.json` | 新增 PostToolUse + Stop 质量钩子 |
| 3 | `.github/hooks/momei.json` | 新增 postVerify 质量钩子 |
| 4 | `.opencode/plugins/session-governance.js` | 补充 after-edit 校验逻辑 |
| 5 | 手动测试 | `node scripts/ai-hooks/session-governance.mjs --platform=manual --event=post-verify` |

## 参考来源

- [Claude Code Hooks: 6 Production Patterns (Pixelmojo, 2026)](https://www.pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns) — Pattern 4: Type Check After Edits
- [Claude Code Hooks: Automated Quality Checks (Luiz Tanure, 2025)](https://www.letanure.dev/blog/2025-08-06--claude-code-part-8-hooks-automated-quality-checks) — 自动 lint/typecheck 模式
- [Claude Code: Hooks to Enforce Quality Gates (DevGenius, 2026)](https://blog.devgenius.io/claude-code-use-hooks-to-enforce-end-of-turn-quality-gates-5bed84e89a0d) — Stop 钩子实现强制校验

## 验证计划

| 层级 | 验证内容 | 方式 |
|---|---|---|
| V0 | 变更范围与风险说明 | 本文档 |
| V1 | hooks 配置语法检查 | JSON 解析 + 脚本静态检查 |
| V2 | post-verify 手动测试 | `node scripts/ai-hooks/session-governance.mjs --platform=manual --event=post-verify` |
| V2 | pre-stop-check 手动测试 | 同方式，验证 stale 检测逻辑 |
| RG | Review Gate | `@code-auditor` 审计 |
