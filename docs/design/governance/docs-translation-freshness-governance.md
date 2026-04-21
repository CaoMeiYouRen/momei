# 文档翻译 freshness 清偿与分层治理

本文档是第三十阶段“文档翻译 freshness 清偿与文档翻译治理”主线的专项设计工件。它只定义文档翻译的 freshness 判定、公开范围、降级策略与质量门口径；中文原文仍然是唯一事实源。

## 1. 背景与问题

当前 `pnpm docs:check:source-of-truth` 会把 `docs/i18n/<locale>/` 下所有翻译页统一按“30 天内必须同步”处理。这条规则过宽，带来了三类问题：

1. 公开入口页与低频深度页被同一条 freshness 规则绑定，导致真正高频页面和低频页面没有优先级差异。
2. 设计文档、专项治理页、低频 Guide 与低频 Standards 的维护成本被隐性抬高，容易诱发“只改 `last_sync`、不改正文”的伪同步。
3. 站点导航仍在持续暴露部分已不再承诺维护的翻译页，用户难以判断哪些页面是正式维护范围，哪些页面应回到中文事实源。

## 2. 本轮目标与非目标

### 2.1 目标

- 让 `docs:check:source-of-truth` 从“全量统一 30 天”收敛为“按 tier 与 locale 判定”。
- 把当前公开翻译页拆分为 `must-sync`、`summary-sync`、`source-only` 三层。
- 让文档站导航只承诺当前真正维护的翻译页，避免继续向用户暴露长期失新的深层页面。
- 为后续阶段提供一份可以直接复用的 scope matrix、验证矩阵与残余债清单。

### 2.2 非目标

- 不把 `docs/design/modules/`、`docs/design/governance/` 等高频变化目录重新扩写成多语全量翻译。
- 不通过忽略脚本报错、放宽到“任何页面都只改 `last_sync`”的方式绕过 freshness 问题。
- 不为 `todo.md`、`backlog.md`、阶段治理正文新增翻译承诺。

## 3. 分层治理模型

| Tier | freshness 口径 | 允许内容形态 | 当前用途 |
| :-- | :-- | :-- | :-- |
| `must-sync` | `30` 天内必须同步 | 面向公开入口的操作等价翻译，不要求逐字逐段对拷，但必须覆盖当前实际操作路径 | `en-US` 首页、快速开始、部署、翻译治理 |
| `summary-sync` | `45` 天内必须同步 | 摘要同步；保留原文回链，允许用更短结构总结最新规则与入口 | 路线图摘要、`en-US` 核心高频规范页、`zh-TW` / `ko-KR` / `ja-JP` 公开入口页 |
| `source-only` | 不做天数 SLA，但必须显式声明“中文事实源优先” | 保留 locale URL 与原文回链的入口页，不再承诺持续翻译正文 | 低频设计页、低频 Guide、当前不再维护的深层 Standards |

补充约束：

1. `source-only` 页面必须保留原有 locale URL，但正文应明确告知用户改读中文原文，不允许继续留存失效的“看起来像完整翻译”的旧内容。
2. `source-only` 页面不得继续占据 locale 导航和侧边栏主入口，避免把“中文事实源优先”页面伪装成正式维护页面。
3. `summary-sync` 页面允许摘要化，但必须覆盖本轮已经进入质量门或导航主入口的关键变化点。

## 4. 当前 locale 范围矩阵

### 4.1 `en-US`

- `must-sync`:
  - `index.md`
  - `guide/quick-start.md`
  - `guide/deploy.md`
  - `guide/translation-governance.md`
- `summary-sync`:
  - `plan/roadmap.md`
  - `guide/development.md`
  - `guide/features.md`
  - `guide/variables.md`
  - `standards/planning.md`
  - `standards/documentation.md`
  - `standards/security.md`
  - `standards/testing.md`
  - `standards/development.md`
  - `standards/ai-collaboration.md`
- `source-only`:
  - `design/*.md`
  - `guide/ai-development.md`
  - `guide/comparison.md`
  - `standards/api.md`

### 4.2 `zh-TW` / `ko-KR`

- `summary-sync`:
  - `index.md`
  - `guide/quick-start.md`
  - `guide/deploy.md`
  - `guide/translation-governance.md`
  - `guide/features.md`
  - `guide/variables.md`
  - `plan/roadmap.md`
- `source-only`:
  - `design/*.md`
  - `guide/development.md`
  - `guide/ai-development.md`
  - `guide/comparison.md`
  - `standards/*.md`

### 4.3 `ja-JP`

- `summary-sync`:
  - `index.md`
  - `guide/quick-start.md`
  - `guide/deploy.md`
  - `guide/translation-governance.md`
  - `plan/roadmap.md`
- 其他路径默认不新增翻译承诺。

## 5. 质量门与脚本契约

`pnpm docs:check:source-of-truth` 本轮调整为以下口径：

1. 先按 locale + 相对路径解析当前文件属于哪个 tier。
2. `must-sync` 页面：要求存在 `last_sync`，且未超过 `30` 天。
3. `summary-sync` 页面：要求存在 `last_sync`，且未超过 `45` 天。
4. `source-only` 页面：不检查 freshness 天数，但必须在 Frontmatter 中显式声明：
   - `translation_tier: source-only`
   - `source_origin: <relative path to zh-CN source>`
5. 任何未被当前治理矩阵覆盖的翻译页都视为配置漂移，直接报错，防止未来继续无门槛扩写翻译承诺。

## 6. 站点导航与目录约束

1. locale 导航与侧边栏只保留 `must-sync` 与 `summary-sync` 页面。
2. `source-only` 页面可以继续保留物理文件与直达 URL，但不应继续出现在 locale 主导航与侧边栏中。
3. 根目录 README 多语言镜像继续按既有约定维护，不纳入本轮 docs 质量门脚本范围。

## 7. 最小验证矩阵

| 维度 | 最小验证 |
| :-- | :-- |
| 范围治理 | `docs/standards/documentation.md`、`docs/guide/translation-governance.md` 与本专项设计文档保持一致 |
| 站点入口 | `docs/.vitepress/config.ts` 不再把 `source-only` 页面暴露为 locale 主入口 |
| 事实源检查 | `pnpm docs:check:source-of-truth` 转绿 |
| 重复页检查 | `pnpm docs:check:i18n` 继续通过 |
| Markdown 质量 | `pnpm lint:md` 通过 |

## 8. 残余风险与下一轮方向

- `source-only` 页面虽然保住了 URL 和事实源回链，但依然代表“该语种没有持续维护这份正文”，后续若访问量或协作频率显著上升，应重新评估是否上收为 `summary-sync`。
- `en-US` 仍是默认对外协作语言，后续若 Standards 或 Development 页再次高频变更，可能需要把其中部分 `summary-sync` 页面重新上收为 `must-sync`。
- `zh-TW` 与 `ko-KR` 当前采用“公开入口页摘要同步 + 深层页面中文事实源优先”的折中策略；下一轮是否扩大范围，应以真实访问需求和维护成本为准，而不是一次性恢复全量翻译承诺。
