---
source_branch: master
last_sync: 2026-02-11
translation_tier: source-only
source_origin: ../../../guide/ai-development.md
---

# AI-Driven Development Guide
This guide introduces developers to leveraging AI Agents for efficient participation in the Momei project. We believe modern development should be a "human-machine collaboration" where humans define intent and AI executes complex, mechanical tasks.

## 1. Core Concept: Hybrid Workflow

In the Momei project, development tasks follow two paths:

1.  **Traditional Path**: For simple text edits, configuration tweaks, or specialized environments unreachable by AI.

::: info Source-Only Scope
This locale now keeps this URL as a source-only entry. For the latest and complete content, use the [Chinese source of truth](../../../guide/ai-development.md).
:::
2.  **AI-Enhanced Path (Recommended)**: For feature development, bug fixes, large-scale refactoring, and test writing.

## 2. Agent System

The project features a suite of integrated AI Agent roles (optimized for GitHub Copilot and others), detailed in [AGENTS.md](../../../../AGENTS.md).

### Choosing the Right Agent

| Task Type | Recommended Agent | Example Prompt |
| :--- | :--- | :--- |
| **New Features** | `@full-stack-master` | "Implement comment functionality as specified in `todo.md`." |
| **Bug Fixes** | `@full-stack-master` / corresponding developer role | "Analyze and fix the layout breaking on mobile in the post detail page." |
| **Testing** | `@test-engineer` | "Add edge-case unit tests for `auth.ts`." |
| **Learning/Q&A** | `@qa-assistant` | "How does the permission system integrate with `better-auth`?" |
| **Code Review** | `@code-auditor` | "Review my recent changes against the development standards." |

## 3. Standard AI Workflow (PDTFC+ Cycle)

All AI agents follow the PDTFC+ workflow, but developers should evaluate it using the current review gates rather than the old “generate then commit twice” mental model:

1.  **Plan**: Check whether the request already belongs to the current `todo.md` scope and clarify acceptance criteria first.
2.  **Do / Audit**: Keep changes bounded, then hand the result to `@code-auditor` instead of treating self-checks as final review.
3.  **Validate / Test**: Run lint, typecheck, targeted tests, or docs validation according to the change type.
4.  **Finish**: Sync docs, tests, and todo state before calling the task complete.

## 4. Best Practices for Developers

-   **Define Intent Clearly**: Ensure you know "what you want" before invoking an agent. If the requirement is vague, let the agent perform a "requirement interview" first.
-   **Trust but Verify**: AI handles the tedious details, but you control the architecture. Review the output of the `Do` phase carefully before the AI proceeds to `Commit`.
-   **Specify Context**: If you know specific target files, mention them (e.g., "Reference `server/api/auth.ts` for this change") to save retrieval time.

## 5. Tool Adaptations

While optimized for **GitHub Copilot**, Momei works with other tools:
-   **Claude Code**: Excellent for full-context reasoning across docs.
-   **Cursor / Codex**: Configure `.github/agents/` instructions as "Rules for AI" or `.cursorrules`.
-   **Windsurf**: Utilize its "Flow" mode with our PDTFC+ standards for automated development.
