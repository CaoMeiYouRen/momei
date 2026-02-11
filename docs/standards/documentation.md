# 文档规范 (Documentation Standards)

## 1. 概述 (Overview)

本文档定义了墨梅 (Momei) 项目的文档编写、组织与维护标准。良好的文档是项目可持续发展的基石，不仅服务于人类开发者，也为 AI 智能体提供关键的上下文信息。

## 2. 文档目录结构 (Directory Structure)

所有文档必须存放于 `docs/` 目录下，并遵循以下分类逻辑：

-   `docs/design/`: 技术架构、UI/UX 设计、API 设计及各功能模块的深度解析。
    -  `docs/design/modules/`: 各核心模块（如认证、文章管理、评论系统）的设计文档。
-   `docs/guide/`: 用户手册、快速开始、部署指南、开发入门及 AI 协同指南。
-   `docs/plan/`: 项目路线图 (`roadmap.md`)、待办事项 (`todo.md`) 及其归档。
-   `docs/standards/`: 各类专项开发规范、安全规范、测试规范及本文档。
-   `docs/en-US/`: (预留) 国际化文档存放目录。

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

本项目文档采用“中英文分治”策略，优先保证核心文档的同步，针对快速迭代的模块文档采取“原文为主、只翻稳定”原则。

### 4.1 核心原则 (Core Principles)

1.  **分级翻译**: 并非所有文档都需要翻译。优先处理对外部用户及新接触博主至关重要的文档。
2.  **源地一致**: 英文文档存放在 `docs/en-US/` 目录下，并严格保持与 `docs/` 根目录一致的目录结构和文件名。
3.  **时效性声明**: 所有翻译文档必须在顶部包含“翻译版本声明”，明确指向中文原文（Source of Truth）。
4.  **人工+AI 协同**: 允许使用大模型进行首轮翻译，但必须经过人工或专项 Agent (`documentation-specialist`) 审核术语一致性。

### 4.2 范围评估 (Scope Assessment)

| 目录/文件 | 翻译要求 | 策略说明 |
| :-- | :-- | :-- |
| `README.md` (根目录) | **强制全部** | 生成 `README.en-US.md`，作为国际门户。 |
| `docs/guide/` | **强制全部** | 用户手册（快速开始、部署、特性）必须保持双语。 |
| `docs/standards/` | **高度推荐** | 开发规范相对稳定，应提供翻译以指导全球参与者。 |
| `docs/design/` | **高层翻译** | 仅翻译全局设计（UI、数据库、API），不深入模块。 |
| `docs/design/modules/` | **暂不翻译** | 模块设计变动频繁，保持中文原文。 |
| `docs/plan/` | **部分翻译** | 仅翻译 `roadmap.md` 已完成的阶段；未来规划免翻。 |
| `docs/plan/todo.md` | **不翻译** | 任务管理文件，仅保留中文。 |

### 4.3 翻译件规范 (Standard for Translated Docs)

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
    # 可选：source_hash: <git_commit_hash>
    ---
    ```

### 4.4 路线图翻译特殊逻辑 (Roadmap Sync)

针对 `roadmap.md`，执行 **渐进式翻译策略 (Progressive Translation)**：
1.  **已完成章节**: 必须提供完整、高质量的对等翻译。
2.  **规划中/积压章节**:
    -   保留二级/三级标题的翻译，以展示蓝图全貌。
    -   正文内容可暂不翻译，使用统一占位符提示：`> [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](RELATIVE_PATH).`
    -   避免因路线图频繁微调而产生大量陈旧的英文描述。

## 5. 特殊文件维护 (Special File Maintenance)

### 5.1 根目录 README.en-US.md

作为 `README.md` 的对等镜像，必须包含：
-   项目简介与核心价值主张。
-   特性列表 (Features)。
-   技术栈 (Tech Stack)。
-   快速上手链接（指向英文文档站）。
-   顶部增加互跳链接：`[中文版](./README.md) | [English Edition](./README.en-US.md)`。

### 5.2 项目规划文档 (Plan Docs)

-   `roadmap.md` 与 `todo.md` 的维护必须严格遵循 [项目规划规范](./planning.md)。
-   任何阶段性的功能完成，必须在 `todo.md` 中标记并在 `roadmap.md` 中体现进度。

## 6. 文档站点配置 (Site Configuration)

文档基于 VitePress 构建，配置文件位于 `docs/.vitepress/config.ts`。

-   **导航栏 (Nav)**: 更新重大目录或外部链接。
-   **侧边栏 (Sidebar)**: 新增 `.md` 文件后，必须根据其分类在对应侧边栏分组中添加链接。
-   **搜索与 SEO**: 确保新页面的标题足够清晰，以便本地搜索能够准确命中。

## 7. AI 协同准则 (AI Synergy)

AI 智能体在处理文档时应遵守以下规则：

1.  **自动同步**: 在实现功能 (Do) 后，必须检查是否有对应的设计或指南需要更新。
2.  **路径感知**: 操作文档前先确认所在目录，确保链接路径正确。
3.  **归档意识**: 定期将已标记为完成的 `todo.md` 条目移动到 `todo-archive.md`。
4.  **禁止修改 CHANGELOG**: 除非明确指令，严禁手动修改由流水线自动维护的 `CHANGELOG.md`。

## 8. 相关文档

-   [开发规范](./development.md)
-   [规划规范](./planning.md)
-   [AI 协作规范](./ai-collaboration.md)
