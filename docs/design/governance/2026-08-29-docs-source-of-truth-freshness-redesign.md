# 2026-08-29 docs:check:source-of-truth freshness 判定重构

> 治理改动单点说明 — 本文档只交代"为什么改、改了什么、哪些章节联动了"。
> 新规范本体见 [`docs/standards/documentation.md` § 6.3](../../standards/documentation.md#63-翻译-freshness-判定) 与 [`docs/guide/translation-governance.md` § 2.1](../../guide/translation-governance.md#21-文档翻译-freshness-分层)，请直接读规范。

## 1. 触发因素

`pnpm docs:check:source-of-truth` 在 weekly regression 中出现长期 false positive：

- 文档站迭代放缓后，仅因 `last_sync` 超过 21/30 天硬上限就阻断 CI；
- 修复路径只能"刷 last_sync 应付检查"，与"实质性同步"治理意图冲突；
- `mtime` 被 checkout / batch tooling 触碰，不能作为"源是否真的变了"的可靠信号。

## 2. 关键改动

1. **判定信号换成 git log**：用 `git log %aI` 拉取作者日期后在 Node 端做字典序比较；自 `last_sync` 以来源有提交才算硬 blocker。
2. **maxAge 软上限**：must-sync=60 天 / summary-sync=120 天；越界仅 warning，不阻断。
3. **`source-only` 强制保持**：仍要求 `translation_tier: source-only` + `source_origin` 显式声明；该 tier 不参与 freshness 判断。
4. **三层 fallback 解析源路径**：`frontmatter.source_origin` → 正文 `original Chinese version` 等锚文本后的相对路径 → `docs/i18n/<locale>/<path>` ⇄ `docs/<path>` 目录约定。

## 3. 落地清单

| 文件 | 改动 |
|:---|:---|
| `scripts/docs/check-source-of-truth.mjs` | 重写 freshness 判定 + 新增 `getSourceCommitCountSince` / `decideTranslationStatus` / `resolveSourceOrigin` 等纯函数；导出 `root` 注入参数便于单测；severity 区分 `pass / warning / error` |
| `tests/scripts/check-source-of-truth.test.ts` | 新建 19 用例（纯函数 + 集成测） |
| `docs/standards/documentation.md` § 4.3.1 + § 6.3 | 规范本体（不提历史理由） |
| `docs/i18n/{en-US,zh-TW,ko-KR,ja-JP}/guide/translation-governance.md` § 2.1 / § 3 / § 4 | 摘要同步 + `last_sync: 2026-08-29` |
| `docs/i18n/en-US/standards/documentation.md` | 摘要同步 + `last_sync: 2026-08-29` |
| `docs/plan/backlog.md` | 文档治理主线当前状态段（已 2026-08 调整判定语义） |

## 4. 行为变化一览

| 判定 | 旧行为 | 新行为 |
|:---|:---|:---|
| 源文档自 `last_sync` 以来在 git 中有提交 | — | **error** |
| 源文档自 `last_sync` 以来无 git 提交，且未越 tier 上限 | pass | **pass** |
| 源文档自 `last_sync` 以来无 git 提交，但 last_sync 超过 tier 软上限 | error（硬阻断） | **warning**（不阻断） |
| `last_sync` 缺失 / 源无法定位 / 源缺失 | error | **error**（保留） |
| `source-only` 页面 | 强制 tier + source_origin，不做时效检查 | **同上**（保留） |

## 5. Run-time 入口

| 命令 | 用途 | 阻断？ |
|:---|:---|:---|
| `pnpm docs:check:source-of-truth`（default profile, error mode） | weekly regression 默认入口 | 仅在源真改时阻断 |
| `pnpm docs:check:source-of-truth --mode=warn` | 把 error 降级为 warning 呈现，文本 message 不变；不改 exit code | 仅展示 |
| `pnpm docs:check:source-of-truth:candidate`（candidate profile, warn mode） | 保留 21/30 天旧阈值作为收紧评估 baseline | 仅展示 |

## 6. 验收条件（落地验证）

| 项 | 期望 | 实测 |
|:---|:---|:---|
| 默认入口 `pnpm docs:check:source-of-truth` | 仅真实治理任务 fail | exit=1，12 条 error（用户已接受作为真实治理任务信号） |
| `pnpm docs:check:source-of-truth:candidate` | 旧阈值仍能输出 baseline | exit=0，25 条 warning |
| 单测 `tests/scripts/check-source-of-truth.test.ts` | 全过 | 19/19 passed |
| 全仓单测 `pnpm test` | 与 baseline 一致 | 4430 passed / 1 skipped |
| `pnpm eslint`（针对改动文件） | 0 error / 0 warning | 通过 |
| `pnpm typecheck`（针对改动文件） | 0 个 check-source-of-truth 相关 error | 通过 |
| `pnpm lint:md` | 0 error | 通过 |

## 7. 后续治理项

- **真实翻译重新同步**：当前 12 条 fail 文件属于"源改了、翻译未跟进"，是真实的翻译治理任务；下个翻译切片上收时对应处理。
- **candidate profile 何时升级**：`pnpm docs:check:source-of-truth:candidate` 保留 21/30 天旧阈值仅作收紧评估 baseline；何时把 candidate 阈值回升到 default、是否进一步收紧 default 阈值，由下一阶段复评估决定（与本条目一并记入 backlog 翻译域块）。
