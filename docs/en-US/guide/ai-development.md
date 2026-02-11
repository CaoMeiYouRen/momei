---
source_branch: master
last_sync: 2026-02-11
---

# AI-Driven Development Guide

This guide introduces developers to leveraging AI Agents for efficient participation in the Momei project. We believe modern development should be a "human-machine collaboration" where humans define intent and AI executes complex, mechanical tasks.

## 1. Core Concept: Hybrid Workflow

In the Momei project, development tasks follow two paths:

1.  **Traditional Path**: For simple text edits, configuration tweaks, or specialized environments unreachable by AI.
2.  **AI-Enhanced Path (Recommended)**: For feature development, bug fixes, large-scale refactoring, and test writing.

## 2. Agent System

The project features a suite of integrated AI Agent roles (optimized for GitHub Copilot and others), detailed in [AGENTS.md](../../AGENTS.md).

### Choosing the Right Agent

| Task Type | Recommended Agent | Example Prompt |
| :--- | :--- | :--- |
| **New Features** | `@full-stack-master` | "Implement comment functionality as specified in `todo.md`." |
| **Bug Fixes** | `@full-stack-developer` | "Analyze and fix the layout breaking on mobile in the post detail page." |
| **Testing** | `@test-engineer` | "Add edge-case unit tests for `auth.ts`." |
| **Learning/Q&A** | `@qa-assistant` | "How does the permission system integrate with `better-auth`?" |
| **Code Review** | `@code-reviewer` | "Review my recent changes against the development standards." |

## 3. Standard AI Workflow (PDTFC+ Cycle)

All AI agents strictly follow the PDTFC+ cycle. You should supervise AI through this lens:

1.  **Plan**: AI analyzes requirements and proposes a plan. **You must review strictly at this stage.**
2.  **Do**: AI automatically modifies code.
3.  **Test**: AI runs Lint and Vitest.
4.  **Fix**: AI self-corrects based on test failures.
5.  **Commit 1**: Submits business logic code.
6.  **Enhance**: AI completes test cases for the new feature.
7.  **Commit 2**: Submits test code.

## 4. Best Practices for Developers

-   **Define Intent Clearly**: Ensure you know "what you want" before invoking an agent. If the requirement is vague, let the agent perform a "requirement interview" first.
-   **Trust but Verify**: AI handles the tedious details, but you control the architecture. Review the output of the `Do` phase carefully before the AI proceeds to `Commit`.
-   **Specify Context**: If you know specific target files, mention them (e.g., "Reference `server/api/auth.ts` for this change") to save retrieval time.

## 5. Tool Adaptations

While optimized for **GitHub Copilot**, Momei works with other tools:
-   **Claude Code**: Excellent for full-context reasoning across docs.
-   **Cursor / Codex**: Configure `.github/agents/` instructions as "Rules for AI" or `.cursorrules`.
-   **Windsurf**: Utilize its "Flow" mode with our PDTFC+ standards for automated development.
