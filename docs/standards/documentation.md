# 文档规范 (Documentation Standards)

## 1. 概述 (Overview)

本文档定义了墨梅博客 项目的文档编写、组织与维护标准。良好的文档是项目可持续发展的基石，不仅服务于人类开发者，也为 AI 智能体提供关键的上下文信息。

## 2. 文档目录结构 (Directory Structure)

所有文档必须存放于 `docs/` 目录下，并遵循以下分类逻辑：

-   `docs/design/`: 技术架构、UI/UX 设计、API 设计及各功能模块的深度解析。
    -  `docs/design/modules/`: 各核心模块（如认证、文章管理、评论系统）的总设计文档，只保留稳定高层入口。
    -  `docs/design/governance/`: 专项治理、专项设计、迁移方案、执行矩阵与阶段复盘文档。
-   `docs/guide/`: 用户手册、快速开始、部署指南、开发入门及 AI 协同指南。
-   `docs/plan/`: 项目路线图 (`roadmap.md`)、长期积压 (`backlog.md`)、待办事项 (`todo.md`) 及规划侧摘要与兼容入口。
-   `docs/reports/regression/`: 回归记录管理、活动回归窗口与按模块 / 日期归档。
-   `docs/standards/`: 各类专项开发规范、安全规范、测试规范及本文档。
-   `docs/i18n/<locale>/`: 翻译文档的物理存储目录，例如 `docs/i18n/en-US/`、`docs/i18n/zh-TW/`、`docs/i18n/ko-KR/`。

补充说明：

- 对外文档站 URL 继续使用 `/<locale>/...`，不得把仓库中的 `i18n/` 物理层级暴露为公共访问路径。
- 翻译文档迁移完成后，旧的 `docs/<locale>/` 目录不得继续保留，也不得重新创建；新增或修改翻译页只能落在 `docs/i18n/<locale>/`，避免 VitePress 生成重复路由。

## 3. 编写标准 (Writing Standards)

### 3.1 标题与层级 (Headings & Hierarchy)

-   **单个一级标题**: 每个文件必须且只能有一个 `#` (H1) 标题，作为页面主标题。
-   **逻辑分级**: 依次使用 `##`, `###` 进行嵌套。严禁跨级使用（如直接从 `##` 跳到 `####`）。
-   **编号一致性**:
    -   大项使用 `1.`, `2.` 数字编号。
    -   子项优先使用无序列表 `-`。
    -   如果流程具有强先后顺序，子项可使用 `1.1`, `1.2` 风格。

### 3.2 语言与风格 (Style & Tone)

-   **专业且简洁**: 使用中性、专业的技术语言。避免冗长描述，优先使用列表和表格。
-   **术语统一**: 确保在全站文档中对同一概念使用相同的专业术语（如：Slug, i18n, Nitro, Auth）。
-   **中英文混排**: 在中文文档中，英文术语与中文之间建议保留一个空格。

### 3.3 链接与引用 (Links & References)

-   **相对路径**: 引用本项目内其他文档时，必须使用相对于当前文件的相对路径。
-   **锚点链接**: 引用文档特定章节时，使用 `#` 锚点（如 `[规范](./development.md#2-代码风格)`）。
-   **外部参考**: 使用完整的 HTTPS 链接。

### 3.4 增强内容 (Enhanced Content)

-   **代码块**: 必须指明语言类型（如 ````typescript`）。
-   **图表**: 复杂逻辑、架构或时序图优先使用 **Mermaid** 语法编写，禁止使用位图截图展示架构。
-   **提示信息**: 使用 VitePress 的自定义容器语语法（::: info, ::: tip, ::: warning, ::: danger）。

## 4. 国际化 (Internationalization)

本项目文档采用“多语言分治”策略，优先保证核心文档的同步，针对快速迭代的模块文档采取“原文为主、只翻稳定”原则。

### 4.1 核心原则 (Core Principles)

1.  **分级翻译**: 并非所有文档都需要翻译。优先处理对外部用户及新接触博主至关重要的文档。
2.  **分层 freshness**: 翻译文档按 `must-sync`、`summary-sync`、`source-only` 三层治理，不再把 `docs/i18n/<locale>/` 下所有页面统一按同一时效窗口处理。
2.  **源地一致**: 
    - 翻译文档统一存放在 `docs/i18n/<locale>/`，并严格保持与 `docs/` 根目录一致的目录结构和文件名。
    - 外部文档站继续使用 `/<locale>/...` 路由；构建层通过 VitePress rewrites 维持“仓库路径”与“公共 URL”解耦。
3.  **时效性声明**: 所有翻译文档必须在顶部包含“翻译版本声明”，明确指向中文原文（Source of Truth）。
4.  **人工+AI 协同**: 允许使用大模型进行首轮翻译，但必须经过人工或专项 Agent (`documentation-specialist`) 审核术语一致性。

### 4.2 当前支持的翻译语言 (Supported Translation Locales)

当前文档体系已支持以下翻译语言：

| Locale | 状态 | 目录 | 说明 |
| :-- | :-- | :-- | :-- |
| `en-US` | 已支持 | `docs/i18n/en-US/` | 默认对外协作语言。首页与核心公开 Guide 维持 `must-sync`，开发 / 规范入口以 `summary-sync` 为主。 |
| `zh-TW` | 已支持 | `docs/i18n/zh-TW/` | 以繁体中文阅读体验为主，当前采用“公开入口页摘要同步 + 深层页中文事实源优先”的渐进式策略。 |
| `ko-KR` | 已支持 | `docs/i18n/ko-KR/` | 以公开入口页摘要同步为主，深层页默认回到中文事实源。 |
| `ja-JP` | `seo-ready` | `docs/i18n/ja-JP/` | 已完成 README、首页、快速开始、部署、翻译治理与路线图摘要同步，并补齐邮件、SEO、站点地图与专项回归验证，作为正式公开语种维护。 |

说明：

- 中文原文 (`docs/`) 仍然是唯一事实源；`ja-JP` 已进入正式公开阶段，但文档仍采用渐进式同步策略，不默认承诺全量模块翻译。

### 4.3 范围评估 (Scope Assessment)

| 目录/文件 | 翻译要求 | 策略说明 |
| :-- | :-- | :-- |
| `README.md` (根目录) | **强制全部** | 至少生成 `README.en-US.md`；其他通过准入的语言可按阶段补充 `README.<locale>.md`。 |
| `docs/guide/` | **强制全部** | 用户手册（快速开始、部署、特性）必须保持双语。 |
| `docs/standards/` | **高度推荐** | 开发规范相对稳定，应提供翻译以指导全球参与者。 |
| `docs/design/` | **高层翻译** | 仅翻译全局设计（UI、数据库、API），不深入模块。 |
| `docs/design/modules/` | **暂不翻译** | 模块总设计变动频繁，保持中文原文。 |
| `docs/design/governance/` | **暂不翻译** | 专项治理与阶段复盘迭代更快，只保留中文事实源。 |
| `docs/plan/` | **部分翻译** | 仅翻译 `roadmap.md` 已完成的阶段；`backlog.md` 与 `todo.md` 默认保持中文。 |
| `docs/plan/todo.md` | **不翻译** | 任务管理文件，仅保留中文。 |

对于 `packages/` 目录下子包的 README 文件，原则上只提供中文和英文版本，且必须保持内容一致。其他语言版本（如韩语、繁体中文）可根据社区需求决定是否提供。

### 4.3.1 freshness 分层与 locale 范围

| Tier | freshness 口径 | 允许内容形态 | 当前典型范围 |
| :-- | :-- | :-- | :-- |
| `must-sync` | `30` 天 | 操作等价翻译，覆盖当前真实入口与操作路径 | `en-US` 首页、快速开始、部署、翻译治理 |
| `summary-sync` | `45` 天 | 摘要同步，保留中文原文回链 | `en-US` 路线图 / 开发指南 / 核心高频规范页；`zh-TW` / `ko-KR` / `ja-JP` 公开入口页 |
| `source-only` | 不做天数 SLA，但必须显式声明“中文事实源优先” | locale URL 保留页，不承诺持续翻译正文 | 低频设计页、低频 Guide、当前不再维护的深层 Standards |

当前 locale 范围矩阵：

| Locale | `must-sync` | `summary-sync` | `source-only` |
| :-- | :-- | :-- | :-- |
| `en-US` | `index`、`guide/quick-start`、`guide/deploy`、`guide/translation-governance` | `plan/roadmap`、`guide/development`、`guide/features`、`guide/variables`、`standards/planning`、`standards/documentation`、`standards/security`、`standards/testing`、`standards/development`、`standards/ai-collaboration` | `design/*`、`guide/ai-development`、`guide/comparison`、`standards/api` |
| `zh-TW` | 无 | `index`、`guide/quick-start`、`guide/deploy`、`guide/translation-governance`、`guide/features`、`guide/variables`、`plan/roadmap` | `design/*`、`guide/development`、`guide/ai-development`、`guide/comparison`、`standards/*` |
| `ko-KR` | 无 | 与 `zh-TW` 相同 | 与 `zh-TW` 相同 |
| `ja-JP` | 无 | `index`、`guide/quick-start`、`guide/deploy`、`guide/translation-governance`、`plan/roadmap` | 其他路径默认不新增翻译承诺 |

### 4.4 翻译件规范 (Standard for Translated Docs)

1.  **顶部提示旗标 (Header Notice)**:
    使用 VitePress 的 `::: warning` 容器：
    ```markdown
    ::: warning Translation Notice
    This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](RELATIVE_PATH_TO_ZH) shall prevail.
    :::
    ```
2.  **Frontmatter (版本溯源)**:
    所有英文文档必须在 Frontmatter 中标注同步元数据，以便 AI 审计员检测过时内容：
    ```yaml
    ---
    source_branch: master
    last_sync: 2026-02-11  # ISO 日期格式
    translation_tier: must-sync # must-sync | summary-sync | source-only
    # source_origin: ../../../guide/ai-development.md # source-only 页面必填
    # 可选：source_hash: <git_commit_hash>
    ---
    ```
3.  **`source-only` 页面要求**:
    - 必须在 Frontmatter 中显式声明 `translation_tier: source-only` 与 `source_origin`。
    - 必须在正文顶部明确说明“本页不再承诺持续维护翻译内容，请以中文原文为准”。
    - 不得继续占据 locale 导航与侧边栏主入口。

### 4.5 路线图翻译特殊逻辑 (Roadmap Sync)

针对 `roadmap.md`，执行 **渐进式翻译策略 (Progressive Translation)**：
1.  **已完成章节**: 必须提供完整、高质量的对等翻译。
2.  **规划中/积压章节**:
    -   保留二级/三级标题的翻译，以展示蓝图全貌。
    -   正文内容可暂不翻译，使用统一占位符提示：`> [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](RELATIVE_PATH).`
    -   避免因路线图频繁微调而产生大量陈旧的英文描述。

## 5. 特殊文件维护 (Special File Maintenance)

### 5.0 模块设计与专项治理分层 (Module vs Governance Layering)

`docs/design/modules/` 与 `docs/design/governance/` 必须承担不同角色，禁止再把两类文档混放在同一目录下。

约束如下：

1.  **模块总设计单独存放**: `docs/design/modules/` 只保留每个主题的稳定高层入口，例如 `system.md`、`i18n.md`、`migration.md`。
2.  **专项治理单独存放**: `docs/design/governance/` 统一承接 `*-governance.md`、`*-unification.md`、`*-optimization.md`、`*-report.md`、执行矩阵和跨模块专项评估文档。
3.  **每个主题只保留一个总设计文档**: 模块总设计负责定义边界、核心流程与主入口；专项文档不得再重复整份模块概述。
4.  **专项文档必须回链主文档**: 所有治理 / 迁移 / 评估文档都应显式说明对应主文档或唯一事实源，避免读者误把专项文档当作全量设计入口。
5.  **设计文档不得承接 Todo 职责**: `docs/design/modules/` 与 `docs/design/governance/` 中都不应保留直接指向 `todo.md` 的“待办清单”式内容；尚未实施的后续工作应写为“后续增强方向”或回到 `docs/plan/roadmap.md`。
6.  **阶段报告继续独立**: 阶段复盘类文档统一放在 `docs/design/governance/`，只保留结论、偏差与索引，不重复展开已收敛到主文档中的实现细节。
7.  **新增文档先判目录归属**: 新建设计文档时，必须先判断它属于“稳定模块总设计”还是“专项治理 / 增量设计 / 阶段复盘”；判断不清时，不得默认写入 `docs/design/modules/`。
8.  **严重漂移处理**: 如果专项治理文档已经无法代表当前实现，优先重写为只保留增量结论的 delta 文档；若已无参考价值，则迁移到归档或直接删除，不保留与事实源脱节的完整说明书。
9.  **中大型改动先有文档工件**: 当事项涉及新模块、跨模块边界重写、数据 / 接口契约调整或需要单独成为一个治理专题时，必须先完成对应设计文档，再进入大规模实现；不得把“设计 + 实现”揉成一条模糊待办后直接跳过文档沉淀。

### 5.1 回归记录文档治理 (Regression Record Governance)

回归记录的正式管理入口不再放在 `docs/plan/` 下，而应统一收敛到 `docs/reports/regression/`。

约束如下：

1.  **管理文档单开一条**: `docs/reports/regression/index.md` 作为回归记录管理规划与索引入口，负责说明当前窗口、归档分层与迁移状态。
2.  **活动窗口独立存放**: 最新回归正文优先写入 `docs/reports/regression/current.md`，只保留最近 1 - 2 个阶段或最近 6 - 8 条完整记录。
3.  **按模块或日期归档**: 历史记录优先拆入 `docs/reports/regression/archive/` 下的模块或日期分片；若归档继续膨胀，再按年份或半年继续拆分。
4.  **计划文档只留入口**: `docs/plan/` 中与回归记录有关的文件仅保留摘要、迁移说明与兼容入口，不再承载长篇正文。
5.  **读写压力触发归档**: 当活动窗口超过 300 - 400 行、或超过 6 - 8 条完整记录且影响当前阶段阅读效率时，必须先滚动归档再继续追加新记录。
6.  **管理文档引用**: 文档规范、规划规范、测试规范与阶段审计文档应统一引用 `docs/reports/regression/index.md`，避免再把新记录入口散落到多个位置。

`roadmap.md` 与 `todo-archive.md` 的深度归档治理继续以 [规划文档深度归档治理](../plan/archive/index.md) 为唯一入口；当前统一阈值如下：

- `README.md`: 作为门户摘要，`<= 300` 行为健康窗口，`301 - 400` 行进入 warning，超过 `400` 行应先把细节回收到 `docs/` 对应专题页，而不是继续在根 README 堆叠正文。
- `roadmap.md`: `<= 800` 行为健康窗口，`801 - 900` 行进入 warning，超过 `900` 行应先拆分旧阶段正文再继续扩写。
- `todo-archive.md`: `<= 1800` 行为健康窗口，`1801 - 2200` 行进入 warning，超过 `2200` 行应先进行阶段区间分片再继续归档。
- `docs/reports/regression/current.md`: `<= 300` 行为健康窗口，`301 - 400` 行进入 warning，超过 `400` 行必须先把旧记录滚动归档到 `docs/reports/regression/archive/`。

上述阈值由 `pnpm docs:check:line-count` 执行检查：warning 区间会输出治理提示，超过 error 线会直接阻断 `docs:build` 与发布前检查，不能再依赖人工目测。

### 5.2 根目录 README 多语言镜像

作为 `README.md` 的对等镜像，必须包含：
-   项目简介与核心价值主张。
-   特性列表 (Features)。
-   技术栈 (Tech Stack)。
-   快速上手链接（指向对应语言的文档站，若尚未开放则显式说明范围）。
-   顶部增加互跳链接，至少覆盖中文与英文；其他已发布语言应一并加入。
-   README 只保留门户型摘要、核心卖点与导航入口；实现细节、治理细则与长篇阶段记录必须回链到 `docs/` 下的事实源页面，不应在根 README 中长期堆积。

### 5.3 项目规划文档 (Plan Docs)

-   `roadmap.md`、`backlog.md` 与 `todo.md` 的维护必须严格遵循 [项目规划规范](./planning.md)。
-   回归记录正式迁移到 [回归记录管理与深度归档](../reports/regression/index.md)；规划文档仅保留与当前阶段直接相关的摘要和入口链接。
-   模块总设计与专项治理文档必须分目录维护：稳定高层入口留在 `docs/design/modules/`，增量治理 / 迁移方案 / 阶段复盘统一落在 `docs/design/governance/`。
 -   活动回归窗口默认只保留最近 1 - 2 个阶段或最近 6 - 8 条完整记录；更早的历史记录应按滚动归档规则迁移到 `docs/reports/regression/archive/`。
-   规划文档、规范文档与其他 Markdown 文档在提交前同样必须经过至少一轮 review，不能因为“只改文档”而跳过审查。
-   任何阶段性的功能完成，必须在 `todo.md` 中标记并在 `roadmap.md` 中体现进度。
-   阶段归档与下一阶段规划必须遵循 [项目规划规范](./planning.md#45-阶段归档与下一阶段规划标准流程-phase-archive-workflow)；不得跳过“准入检查 -> 证据链检查 -> 文档同步 -> Review Gate -> 下一阶段闸门”的固定顺序。
-   若当前阶段某条主线命中“设计先行闸门”，则 `roadmap.md` 与 `todo.md` 必须显式写出“先完成设计文档，再进入实现”的约束，防止执行时按最小解释直接跳过设计工件。

补充约束：

1. `docs/reports/regression/current.md` 不采用“阶段完成即整份搬空”的归档方式，而采用滚动归档，确保最近基线比较和发版判断仍可直接在主日志中完成。
2. 同一条回归记录迁移到归档文件时必须整体迁移，不得将执行命令、Review Gate 结论与后续补跑计划拆散到多个位置。
3. 若 `docs/reports/regression/archive/` 继续膨胀，应再按年份或半年分拆，而不是重新把历史记录塞回活动窗口。
4. `docs/plan/regression-log*.md` 只保留兼容回看职责，不再继续追加新的正式回归正文；新增记录统一落在 `docs/reports/regression/current.md`。
5. 若阶段状态从“规划中 / 进行中”变为“已归档 / 已审计归档”，必须同步检查 `docs/i18n/*/plan/roadmap.md` 的摘要状态与 `last_sync`，但 `todo.md` 与 `backlog.md` 仍保持中文事实源，不为归档动作单独扩展翻译件。
6. 阶段归档块必须能独立说明“为什么可以归档”，至少包含审计结论、主线完成情况、关键验证或回归入口，以及残余风险或后续观察项；不得只写一句“已完成”。

## 6. 事实源收敛机制 (Source of Truth Convergence)

### 6.1 权威层级定义

| 层级 | 文档 | 约束 |
|------|------|------|
| L0 | `AGENTS.md` | 项目级 AI 行为准则、职责边界、安全红线、PDTFC+ 工作流 |
| L1 | `docs/standards/*.md` | 专项开发规范（开发、API、测试、安全、文档等） |
| L2 | `docs/design/*.md` | 架构与模块设计 |
| L3 | `CLAUDE.md` / 平台适配文件 | 工具差异与降级策略 |

### 6.2 收敛规则

1. **禁止重复定义**：低层级文档不得重复高层级已定义的规则
2. **引用优先**：同一内容在多处出现时，应引用唯一事实源而非重复描述
3. **版本溯源**：翻译文档必须标注 `last_sync` 日期，过期超过 30 天应触发 review

### 6.3 过时内容识别

- `must-sync` 页面的 `last_sync` 超过 `30` 天应触发 review
- `summary-sync` 页面的 `last_sync` 超过 `45` 天应触发 review
- `source-only` 页面不以天数判断 freshness，但必须持续保留明确的中文事实源回链与 tier 声明
- 智能体在引用文档时，应检查文件头部的时间戳
- 定期运行 `pnpm i18n:audit` 检查未同步的翻译键

### 6.4 维护职责

| 文件 | 维护责任人 | 更新触发条件 |
|------|-----------|-------------|
| `AGENTS.md` | 项目所有者 | 智能体体系、PDTFC+ 工作流、安全红线变更 |
| `CLAUDE.md` | `@documentation-specialist` | `AGENTS.md` 重大变更后同步检查 |
| `docs/standards/*.md` | 各专项规范负责人 | 规范内容变更 |
| `docs/design/*.md` | 架构设计负责人 | 架构或模块设计变更 |

## 7. 文档站点配置 (Site Configuration)

文档基于 VitePress 构建，配置文件位于 `docs/.vitepress/config.ts`。

-   **导航栏 (Nav)**: 更新重大目录或外部链接。
-   **侧边栏 (Sidebar)**: 新增 `.md` 文件后，必须根据其分类在对应侧边栏分组中添加链接。
-   **搜索与 SEO**: 确保新页面的标题足够清晰，以便本地搜索能够准确命中。
-   **目录重写 (Rewrites)**: 翻译页迁移到 `docs/i18n/<locale>/` 后，必须同步维护 rewrites，使外部 URL 仍保持 `/<locale>/...`。
-   **编辑链接 (Edit Link)**: `editLink` 必须指向真实源文件路径，确保迁移后“编辑此页”不会落回旧目录。
-   **重复页阻塞检查**: 所有文档构建前都必须执行 `pnpm docs:check:i18n`；若发现 `docs/<locale>/` 旧目录回流，或同一路由同时存在旧目录与 `docs/i18n/<locale>/` 两份翻译源文件，必须先清理后再继续构建。

## 8. AI 协同准则 (AI Synergy)

AI 智能体在处理文档时应遵守以下规则：

1.  **自动同步**: 在实现功能 (Do) 后，必须检查是否有对应的设计或指南需要更新。
2.  **路径感知**: 操作文档前先确认所在目录，确保链接路径正确。
3.  **Review 意识**: 文档改动、规划改动和归档整理同样要经过 review，并保留明确的审查结论或问题清单。
4.  **归档意识**: 定期将已标记为完成的 `todo.md` 条目移动到 `todo-archive.md`。
5.  **禁止修改 CHANGELOG**: 除非明确指令，严禁手动修改由流水线自动维护的 `CHANGELOG.md`。

## 9. 相关文档

-   [开发规范](./development.md)
-   [规划规范](./planning.md)
-   [AI 协作规范](./ai-collaboration.md)
