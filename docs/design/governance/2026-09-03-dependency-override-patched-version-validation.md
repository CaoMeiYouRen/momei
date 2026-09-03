# 2026-09 依赖 override 区间与 patched 版本对齐校验治理

## 1. 背景

`pnpm-workspace.yaml` 的 `overrides` 段为规避依赖链中无法独立升级的传递依赖问题提供强制重解析能力，但**仅靠 override 区间本身不能保证安全**——必须同时满足「override 装到的最高版本 ≥ 上游 advisory 的 patched 阈值」。

仓库已 5 次以上踩到同一坑：开发者写 `pkg: "^x.y.z"` 时参考的是 changelog 中提到的"修复在 x.y.N"，但 advisory 实际上把 patched 阈值定在更高的 `x.y.M`（M > N），lockfile 仍然装到 `x.y.N-1` 的受漏洞影响版本。`pnpm audit` 在 push 后才发现，导致依赖 bump 批次合并被回退或修复 commit。

## 2. 踩坑案例

| 引入 commit | 包 | override 写法 | 实际装版本 | patched 阈值 | 影响 |
|:------------|:---|:--------------|:-----------|:-------------|:-----|
| `325a145b` | `fast-uri` | `^3.1.4` | `3.1.5` | `>=3.1.6` | CI run 33756431838 Pre-check 在 `security:audit-deps` 失败，4 条 high CVE |
| `78ca8d77` | `undici` / `piscina` / `nodemailer` | 旧版范围 < patched | 受漏洞版本 | 新 patched | 同类批量踩坑，3 项 high CVE |
| `efbe95c8` | 3 个 high CVE 包 | override 区间错位 | 受漏洞版本 | 新 patched | 一次修 3 个 |
| `18977315` | `hono` | `< 4.12.25` | 受漏洞版本 | `>=4.12.25` | GHSA-88fw-hqm2-52qc |
| `d0432303` | `deepmerge-ts` | 旧版范围 | 受漏洞版本 | `>=8.0.0` | GHSA-ggr8-5vv4-36mx |

共通模式：
- 写 override 时参考 changelog / dependabot PR 描述，但这些来源未必同步 advisory 数据库的 patched 阈值
- `pnpm audit` 是事后审计，必须装到受漏洞版本后才会报
- PR 阶段的 `test` workflow 之前没有 override 校验，导致问题在 push master 后才被 docker / release workflow 拦下

## 3. 结论

- **CI 门禁新增校验脚本** `scripts/security/validate-override-patched-versions.mjs`
- `workflow-precheck.mjs` 三个 profile（release / test / docker）在 `security:audit-deps` 之前跑该脚本，违规时 exit 1
- 校验脚本接受 `--mode warn|error`，默认 `error`；诊断包含包名、override 写法、实际装版本、advisory、最低 patched、推荐修复写法
- 与现有 `dependency-risk-allowlist.json` 协作：allowlisted 的 advisory 不触发该 gate
- 与 `check-dependency-risk.mjs`（audit gate）解耦：本 gate 只看"override 写错"的人为失误，audit gate 继续兜底"上游无补丁"

## 4. 校验规则

### 4.1 适用范围

仅校验**裸名 override**（如 `fast-uri: "^3.1.4"`），不校验 scoped override（如 `ajv@^6.0.0: "^6.14.0"`）：
- scoped override 是"在某个版本区间内强制升级"，意图是把范围下限/上限平移到另一版本
- 裸名 override 是"卡 patched 最低门槛"，错误代价最高（任意外部依赖图都可能重新引入该包）
- scoped override 的版本错位风险由 `pnpm audit` 兜底即可

### 4.2 违规判定

对每个裸名 override（包名为 P，区间为 R）：
1. 从 `pnpm-lock.yaml` 提取 P 在所有 snapshot 中被实际依赖的最高版本 V
2. 调 `pnpm audit --json` 拿到 P 的所有 high+ advisory 列表
3. 对每个 advisory A，取 `patched_versions` 字符串中的最低版本号 M（支持 `>=M`、`<X` 复合、`||` 多分支）
4. 若 `V < M` → 违规，输出 `建议：override 改为 "^M" 或 ">=M" 并刷新 pnpm-lock.yaml`
5. 若 A 在 `dependency-risk-allowlist.json` 中 → 跳过
6. 若 `patched_versions` 为 `unavailable` / `*` / 空 → 跳过（让 audit gate 继续处理）

### 4.3 不替代的检查

- 上游无补丁的情况：依赖 audit gate（`security:audit-deps`）兜底
- 已知漏洞但 allowlist 过期的情况：依赖 allowlist 巡检（`security:audit-deps:daily`）
- scoped override 写错的情况：依赖 pnpm audit

## 5. CI 集成

```
┌─────────────────────────────────────────────────┐
│ workflow-precheck (release / test / docker)     │
├─────────────────────────────────────────────────┤
│ ... critical files / env checks ...             │
│ ▶ security:validate-overrides   ← NEW           │
│ ▶ security:audit-deps                            │
└─────────────────────────────────────────────────┘
```

`createOverridePatchedVersionStep()` 在 audit 之前执行：
- 失败时 exit 1，CI 阻断
- 失败时不进入 audit 步骤（节省 CI 时间）
- 与 `release` / `test` / `docker` 三个 profile 全部接入，确保 PR 阶段就能拦

## 6. 失败处理流程

校验脚本输出形如：

```
Blocking violations (2):
- override fast-uri: "^3.1.4" → installs 3.1.5, but GHSA-5jgf-p345-68v8 (high) requires patched >= 3.1.6
  title: fast-uri vulnerable to host confusion via skipped IDN canonicalization
  remediation: raise the override to "^3.1.6" or ">=3.1.6" and refresh pnpm-lock.yaml
```

修复步骤：
1. 按 `remediation` 提示改 `pnpm-workspace.yaml` 的 override
2. `pnpm install` 刷新 lockfile，确认实际装版本 ≥ 最低 patched
3. `pnpm run security:validate-overrides` 复跑应为 Pass
4. `pnpm run security:audit-deps` 复跑应不再报该 CVE

## 7. 已知边界与后续 TODO

| 边界 | 当前行为 | 后续 |
|:-----|:---------|:-----|
| 同一包名多 advisory 取最低 patched | 已实现 | — |
| `patched_versions` 复合表达式（`<` 上限） | 已实现 `extractMinPatchedVersion` | — |
| scoped override 写错 | 不拦，依赖 audit | 未来按需扩展 |
| 暂未支持 GitHub Advisory API 直连（仅用 pnpm audit） | — | daily 巡检脚本可考虑切换 |
| `pnpm-lock.yaml` 用 `npm:` alias（如 `html-minifier: "npm:html-minifier-terser@^7.2.0"`）时版本解析 | 当前忽略（alias 包不会进 audit） | 监控 daily 巡检中是否漏报 |

## 8. 关联

- 引入 commit：`576c7a55`（`chore(deps): override fast-uri ^3.1.6 修复 4 条 high CVE`）
- 触发 CI run：[actions/runs/33756431838](https://github.com/CaoMeiYouRen/momei/actions/runs/33756431838)（Publish Docker Image / security:audit-deps 失败）
- 长期主线：backlog 长期主线第 7 条「文档事实源、翻译与分层归档治理」中的「依赖治理工具链完整性」子项
