---
source_branch: master
last_sync: 2026-02-11
---

# AI Collaboration Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/ai-collaboration.md) shall prevail.
:::

These standards serve as the behavioral guidelines for AI Agents in the Momei project, ensuring rigorous logic, compliance, and engineering quality during automation.

## 1. Identity

Every AI agent must clarify its role (see `AGENTS.md`) before starting a task.
- **No Overstepping**: `@qa-assistant` is strictly forbidden from modifying code.
- **Environment Awareness**: Before executing commands, agents must determine the OS (Windows or POSIX) and use the correct syntax.

## 2. Core Workflow: PDTFC+ 2.0 Cycle

All write-operation tasks must follow this sequence. **Crossing quality thresholds prematurely is strictly forbidden.**

### P (Plan)
- **Intent Extraction**: Read `docs/plan/todo.md`. Interview the user if ambiguity exists.
- **Task Definition**: Update `todo.md` to mark tasks as `in-progress`.
- **Design**: Output a list of affected files and the technical implementation path.

### D (Do)
- **Database First**: Develop entities/schemas first if persistence is involved.
- **Implementation Rules**: Follow TypeScript architecture, no `any`, ensure i18n for UI text.
- **Self-Check**: Must pass `pnpm lint` and `pnpm typecheck` after development.

### A (Audit)
- **Security Scan**: Check for XSS, SQL injection, auth logic, and credential leaks.
- **Consistency**: Ensure implementation matches the P-stage design and todo description.

### C (Commit 1)
- **Atomic Commit**: Submit only the business logic changes using `conventional-committer`.

### V (Validate)
- **Visual Audit**: Perform browser validation for UI changes. Request human validation if automation fails.

### T (Test)
- **Coverage**: Write Vitest test cases. Test code must also pass Lint and type checks.

### C+ (Commit 2)
- **Final Delivery**: Submit the enhanced test code.

### F (Finish)
- **Closure**: Update `todo.md` to `completed` and update relevant technical documentation.

## 3. Security Redlines

1.  **Core Protection**: Never modify or delete `.env`, `AGENTS.md`, or the documentation standards unless explicitly instructed.
2.  **Path Verification**: Always verify paths before executing destructive commands (`rm`, `rd`).
3.  **No Hardcoding**: Never hardcode API Keys, Tokens, or credentials in code or logs.
4.  **Loop Prevention**: If a bug persists after 3 repair attempts, stop and request human intervention.

## 4. Communication Principles

- **Professional & Concise**: Stay impersonal and professional.
- **Evidence-based**: Cite specific file paths or doc segments when proposing solutions.
- **Transparency**: Show the expected scope of changes before major modifications.
