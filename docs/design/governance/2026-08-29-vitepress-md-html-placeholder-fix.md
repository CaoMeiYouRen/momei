# 2026-08-29 修复 VitePress 构建：`§3.5` 反例清单 Markdown 占位符被误识别为 HTML 标签

> 治理改动单点说明 — 本文档只交代"为什么改、改了什么、哪些章节联动了"。
> 新规范本体见 [`docs/standards/documentation.md` § 3.5](../../standards/documentation.md#35-无历史叙述原则-no-historical-narrative)，请直接读规范。

## 1. 触发因素

GitHub Actions `Deploy VitePress site to Pages` run `33233159973`（2026-08-29 凌晨）在 `Build with VitePress` 任务失败，错误为：

```
[plugin vite:vue] docs/standards/documentation.md:64:163
RolldownError: Element is missing end tag.
SyntaxError: Element is missing end tag.
```

根因：上一批次提交 `0f4f0881` 引入的新 §3.5「无历史叙述原则」段在中英两份文档中各埋了 2 处占位符 `` `<日期>` `` / `` `<旧值>` `` / `` `<新值>` `` / `` `<N-MM-DD>` `` / `` `<date>` ``，被 markdown-it 误判为未闭合的 HTML 自定义元素（custom-element 命名规则 `*[a-z]+-[a-z]+-*`），原样透传到 Vue 模板编译器导致 SFC 构建失败。

markdown-it 不转义 `<...>` 的条件：占位符出现在**纯 prose 文本**（未包入 backtick 反引号），且满足 HTML 自定义元素命名规则（连字符 + ASCII 字母数字）。诸如 `` `<locale>` `` 等无连字符的占位符侥幸未匹配 Vue 的 custom element 判定，所以历史文档没爆。

## 2. 关键改动

1. **§3.5 §1 反例清单**：把所有在 prose（中文双引号或英文双引号内）里的 `` `<X>` `` 占位符包入 backtick，让 markdown-it 视作 code 处理 → HTML 自动转义到 `&lt;X&gt;`。
2. **§3.5 §2 路径占位符**：`` `<YYYY-MM-DD>` `` → `` `[YYYY-MM-DD]` ``，与 `docs/design/governance/session-wisdom-distillation.md` 第 94/99/155 行已用的 `` `[YYYY-MM-DD] [type]` `` 项目内既有约定一致；同步更新关联 skill / agent 文件的路径记法：
   - `.github/skills/code-quality-auditor/references/review-checklist.md` §4.6 lines 77、81
   - `.github/skills/code-quality-auditor/SKILL.md` 步骤 4 line 68
   - `.github/skills/full-stack-master/SKILL.md` D 阶段步骤 7 line 48
   - `.github/agents/code-auditor.agent.md` 主责边界 line 30
3. **未触碰内容**：
   - §3.5 §1 严格禁止的时间锚叙述清单本身保留（含中文反例 `"自 YYYY-MM 起"` / `新策略（N-MM-DD 落地）` 等），其中 `N-MM-DD` 等无角括号变体已经天然安全，不需要改。
   - 已有真实 governance 文件命名（如 `2026-08-29-*.md`）保持不变。

## 3. 落地清单

| 文件 | 改动 |
|:---|:---|
| `docs/standards/documentation.md` line 61 | 中文反例中的 `<日期>` / `<旧值>` / `<新值>` / `<N-MM-DD>` 包入 backtick |
| `docs/standards/documentation.md` line 64 | `<YYYY-MM-DD>` → `[YYYY-MM-DD]`（§3.5 §2 路径占位符） |
| `docs/standards/documentation.md` line 67 | `"已于 <date> 完成"` → `"已于 <backtick> <date> <backtick> 完成"` |
| `docs/i18n/en-US/standards/documentation.md` line 68 | en-US 中文对照行 `<N-MM-DD>` 包入 backtick |
| `docs/i18n/en-US/standards/documentation.md` line 70 | 路径占位符同步 `<YYYY-MM-DD>` → `[YYYY-MM-DD]` |
| `docs/i18n/en-US/standards/documentation.md` line 77 | `"completed on <date>"` → 包 backtick |
| `.github/skills/code-quality-auditor/references/review-checklist.md` lines 77 / 81 | 路径占位符同步 |
| `.github/skills/code-quality-auditor/SKILL.md` line 68 | 路径占位符同步 |
| `.github/skills/full-stack-master/SKILL.md` line 48 | 路径占位符同步 |
| `.github/agents/code-auditor.agent.md` line 30 | 路径占位符同步 |
| 本文档（`docs/design/governance/2026-08-29-vitepress-md-html-placeholder-fix.md`） | 新增治理单点说明 |

## 4. 验证矩阵

| 验证项 | 结果 |
|:---|:---|
| `pnpm docs:build` | exit 0（VitePress 1.6.4 + markdown-it 渲染 + Vue SFC 全链路，无 `Element is missing end tag`） |
| `pnpm lint:md` | exit 0 |
| `pnpm docs:check:i18n` | passed |
| `pnpm docs:check:line-count` | passed |
| `pnpm docs:check:links` | OK（240 个 md 文件本地链接全部有效） |
| `pnpm exec eslint docs/standards/documentation.md docs/i18n/en-US/standards/documentation.md` | exit 0 |
| Code-auditor Review Gate | **Pass**（quick 档；详见任务反馈） |

## 5. 复发防护

- **§3.5 §2 路径占位符**：今后规范正文中引用 `docs/design/governance/[YYYY-MM-DD]-*.md` 必须用方括号记法，与本治理文档对齐。
- **§3.5 §1 反例占位符**：今后在 prose 中演示"被禁止的形式"时，若占位符含连字符（例如 `` `<YYYY-MM>` `` / `` `<N-MM-DD>` ``），必须包入 backtick。无连字符的简单占位符（如 `` `<date>` ``）同样建议包入 backtick 以保持视觉一致。
- **审计入口**：`code-quality-auditor` §4.6 与 `code-auditor` agent 的强制审查项已同步更新，未来改动触发 §3.5 时审计员自动按新口径判定。
- **未做**：不在 audit 入口增加"占位符是否被 backtick 包裹"的强制审查项（属于样式层，不算 rule 违反；该问题在 VitePress 构建阶段会被自动拦截，等于隐式兜底）。
