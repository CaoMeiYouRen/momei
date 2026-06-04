---
source_branch: master
last_sync: 2026-06-04
---

# AI Collaboration Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/ai-collaboration.md) shall prevail.
:::

These standards serve as the behavioral guidelines for AI Agents in the Momei project, ensuring rigorous logic, compliance, and engineering quality during automation.

## 1. Identity

Every AI agent must clarify its role (see `AGENTS.md`) before starting a task.
- **No Overstepping**: `@qa-assistant` is strictly forbidden from modifying code.
- **Environment Awareness**: Before executing commands, agents must determine the OS (Windows or POSIX) and use the correct syntax.

### 1.3 Execution Principles

1.  **Search-First**: When external information is needed, root cause is unclear, or a fix has failed >= 2 times, search tools must be used to obtain primary-source information before continuing analysis or implementation. See [1.4 Search-First](#14-search-first) for detailed triggers, search strategies, and source credibility principles.
2.  **Explicit Assumptions**: When requirements are ambiguous, boundaries undefined, or context is insufficient, assumptions, alternatives, and risks must be stated first. Proceeding silently with one interpretation at scale is forbidden.
3.  **Simplicity First**: Default to the smallest implementation that satisfies current acceptance criteria. Do not introduce unrelated abstractions, configuration layers, or future capabilities as a side effect.
4.  **Surgical Changes**: The scope of changes must map one-to-one with user requests, Todo checkpoints, or blockers. Unrelated issues may be noted but must not be merged into the current implementation.
5.  **Goal-Driven Verification**: Define success criteria, minimum verification matrix, and a distinguishing check before starting implementation. After the first substantive change, perform minimum-sufficient verification before deciding to expand.

### 1.4 Search-First

AI agents must **prioritize using search tools to obtain primary-source information** when dealing with external information needs, unknown problem investigation, or hypothesis verification. Generating answers purely from training data memory is strictly forbidden.

#### Triggers

The following scenarios **must** trigger a search (any one is sufficient):

| Scenario | Typical Signals | Search Targets |
| :--- | :--- | :--- |
| **Troubleshooting Blocked** | Same issue failed >= 2 fixes, unclear root cause, error points to unknown domain | Error keywords, similar issues, official troubleshooting docs |
| **Technical Design** | Unfamiliar library/framework/API, need performance comparison, multiple candidate approaches | Official docs, community best practices, known pitfalls |
| **Requirements or Config Clarification** | Vague user description, missing acceptance criteria, uncertain external service behavior | Official config reference, similar implementations, API contracts |
| **Security or Compliance** | Authentication, encryption, data protection, third-party integration security | CVE database, official security advisories, OWASP guides |
| **Cross-Platform Differences** | Windows/Linux/macOS behavior differences, Node version differences, WSL/Docker quirks | Platform-specific issues, official compatibility notes |
| **Dependency Selection or Upgrades** | New dependency, major version upgrade, alternative evaluation | npm/registry info, changelogs, migration guides, community feedback |

#### Search Strategy

1.  **Multi-Language Search**: For technical topics, use at least Chinese + English keywords. For topics in specific language ecosystems (e.g., Japanese anime, Korean K-pop), expand with original-language keywords.
2.  **Multi-Source Fetch**: Batch-fetch full content of top-ranked search results, prioritizing official documentation (`*.dev`, `github.com/org/repo`), authoritative issue trackers, and well-known technical communities.
3.  **Cross-Reference**: Critical facts (version numbers, config options, performance data, security conclusions) must be confirmed by at least 2 independent sources. When sources conflict, official documentation prevails — "majority vote" is not acceptable.
4.  **Tool Degradation**: If the primary search tool is unavailable, automatically switch to the next available tool. If all fail, record the capability gap and inform the user — never silently skip.

#### Source Credibility Principles

| Priority | Source Type | Examples | Acceptance Conditions |
| :--- | :--- | :--- | :--- |
| **L1 (Preferred)** | Official docs, source repos | `nuxt.com/docs`, `github.com/nuxt/nuxt` | Direct adoption; serves as ultimate arbiter |
| **L2 (Acceptable)** | Authoritative tech communities, reputable blogs | StackOverflow (high-score answers), Vite official blog | Must not contradict L1; key data needs dual-source confirmation |
| **L3 (Reference)** | Personal blogs, Medium, Reddit | Developer personal experience | Ideas only; must not serve as sole factual basis |
| **L4 (Excluded)** | Content farms, machine-translated sites, low-cost TLDs | `.cc`/`.xyz`/`.top` scrapers | Discard immediately; must not be cited |

#### Prohibited Behaviors

-   Replacing actual search results with training data memory
-   Drawing conclusions from only the first search result
-   Skipping adversarial search verification for medical/legal/financial/security claims
-   Making factual claims without traceable URLs
-   Failing to trace back to official sources when search results conflict
-   Giving up after one search tool fails (try all available tools)
-   Skipping information gathering steps because "checking takes too much time"

Refer to the `super-search` skill for detailed search workflows and adversarial review rules.

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
- **Comment Audit**: Check whether complex logic and key functions, especially exported functions, have comments that are accurate, proportionate, and still aligned with the current implementation. Treat stale, misleading, or line-by-line comments as review issues.

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
