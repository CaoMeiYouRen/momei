---
source_branch: master
last_sync: 2026-02-11
---

# Documentation Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/documentation.md) shall prevail.
:::

## 1. Overview

These standards define the requirements for writing, organizing, and maintaining documentation for the Momei project. High-quality documentation is the cornerstone of project sustainability, serving both human developers and providing critical context for AI agents.

## 2. Directory Structure

All documentation must be stored under the `docs/` directory and follow this categorization logic:

-   `docs/design/`: Technical architecture, UI/UX design, API design, and in-depth analysis of functional modules.
    -   `docs/design/modules/`: Design documents for core modules (e.g., Auth, Article Management, Comments).
-   `docs/guide/`: User manuals, Quick Start, Deployment guides, Development onboarding, and AI Collaboration guides.
-   `docs/plan/`: Project roadmap (`roadmap.md`), TODO lists (`todo.md`), and their archives.
-   `docs/standards/`: Specialized development standards, security standards, testing standards, and this document.
-   `docs/en-US/`: Directory for internationalized (English) documentation.

## 3. Writing Standards

### 3.1 Headings & Hierarchy

-   **Single H1 Heading**: Each file must have exactly one `#` (H1) heading as the main page title.
-   **Logical Hierarchy**: Use `##`, `###`, etc., sequentially. Do not skip levels (e.g., jumping from `##` to `####`).
-   **Consistency in Numbering**:
    -   Use `1.`, `2.` for major sections.
    -   Use bullet points `-` for sub-items.
    -   For strictly sequential processes, use `1.1`, `1.2` style sub-numbering.

### 3.2 Language & Tone

-   **Professional & Concise**: Use neutral, technical language. Avoid long-winded descriptions; prioritize lists and tables.
-   **Unified Terminology**: Ensure consistent use of technical terms (e.g., Slug, i18n, Nitro, Auth) across the entire site.
-   **Mixing English & Chinese**: In Chinese documents, keep a space between English terms and Chinese characters.

### 3.3 Links & References

-   **Relative Paths**: Use relative paths when referencing other documents within the project.
-   **Anchor Links**: Use `#` anchors for specific sections (e.g., `[Standards](./development.md#2-code-style)`).
-   **External References**: Use full HTTPS links.

### 3.4 Enhanced Content

-   **Code Blocks**: Must specify the language type (e.g., ````typescript`).
-   **Diagrams**: Complex logic, architecture, or sequence diagrams should be written using **Mermaid** syntax. Binary screenshots of architecture are discouraged.
-   **Notices**: Use VitePress custom containers (`::: info`, `::: tip`, `::: warning`, `::: danger`).

## 4. Internationalization (i18n)

This project adopts a "Dual-Language Governance" strategy. We prioritize syncing core documentation while using a "Source-First, Stable-Only Translation" approach for fast-iterating module docs.

### 4.1 Core Principles

1.  **Tiered Translation**: Not all documents require translation. Priority is given to documents essential for external users and new developers.
2.  **Structural Consistency**: English documents in `docs/en-US/` must strictly mirror the directory structure and filenames of the `docs/` root.
3.  **Source of Truth**: All translations must include a header notice pointing to the original Chinese version.
4.  **AI + Human Collaboration**: Initial translations by LLMs are allowed but must be reviewed by a human or a specialized agent (`documentation-specialist`) for terminology consistency.

### 4.2 Scope Assessment

| Directory/File | Translation Requirement | Strategy Note |
| :-- | :-- | :-- |
| `README.md` (root) | **Mandatory** | Sync to `README.en-US.md` as the international portal. |
| `docs/guide/` | **Mandatory** | User manuals (Quick Start, Deploy, Features) must be bilingual. |
| `docs/standards/` | **Highly Recommended** | Stable development standards that guide global contributors. |
| `docs/design/` | **High-Level Only** | Translate global architecture (UI, DB, API); skip deep module logic. |
| `docs/design/modules/`| **No Translation** | Fast-changing module designs remain in Chinese. |
| `docs/plan/` | **Progressive** | Translate completed roadmap stages; future planning is skipped. |
| `docs/plan/todo.md` | **No Translation** | Task management file remains in Chinese only. |

### 4.3 Standard for Translated Docs

1.  **Header Notice**:
    Use the VitePress `::: warning` container:
    ```markdown
    ::: warning Translation Notice
    This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](RELATIVE_PATH_TO_ZH) shall prevail.
    :::
    ```
2.  **Frontmatter (Metadata)**:
    Required for AI auditors to detect outdated content:
    ```yaml
    ---
    source_branch: master
    last_sync: 2026-02-11
    ---
    ```

### 4.4 Roadmap Sync Logic (Progressive Translation)

1.  **Completed Sections**: Must provide high-quality full translation.
2.  **Planning/Backlog Sections**:
    -   Keep translated H2/H3 headings for the full vision.
    -   Use a placeholder for content: `> [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](RELATIVE_PATH).`
    -   Prevents outdated English descriptions due to frequent roadmap tweaks.
