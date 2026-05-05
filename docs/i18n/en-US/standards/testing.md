---
source_branch: master
last_sync: 2026-05-05
translation_tier: summary-sync
---

# Testing Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/testing.md) shall prevail.
:::

## 1. Overview

This document outlines the testing process for the Momei blog to ensure code quality and system stability. The project uses **Vitest** as the primary testing framework, integrated with a strict CI/CD process to ensure every commit is validated.

## 2. Test Tools

-   **Unit & Integration Testing**: [Vitest](https://vitest.dev/)
    -   Chosen for its speed, seamless integration with the Vite/Nuxt ecosystem, and Jest-compatible API.
-   **End-to-End (E2E) Testing**: Playwright (Recommended).
-   **Test Runner**: `pnpm test`

## 3. Directory Structure & Naming

### 3.1 Unit Tests

Unit tests for pure logic, utility functions, and components must be **co-located** with their source files.

**Example structure**:

```plain
utils/
  ├── date-formatter.ts
  └── date-formatter.test.ts  <-- Unit Test
components/
  ├── article-card.vue
  └── article-card.test.ts     <-- Component Test
```

-   **Naming Convention**: `[filename].test.ts`
-   **Scope**:
    -   Utility functions (`utils/`)
    -   Vue components (`components/`, `pages/`) - focusing on logic and rendering
    -   TypeORM entity logic
    -   Store state management (`stores/`)

### 3.2 Server-side Integration / API Tests

Tests involving database interaction, API calls, and complete business workflows are stored in the `tests/` directory.

-   **Location**: `tests/server/`
-   **Naming Convention**: `[feature].test.ts` or `[api-path].test.ts`
-   **Scope**:
    -   API interface tests (`server/api/`)
    -   Database connection and query tests (`server/database/`)
    -   Complex business logic integration

### 3.3 End-to-End (E2E) Tests

E2E test files are stored in the `tests/e2e/` directory at the project root.

-   **Location**: `/tests/e2e/`
-   **Naming Convention**: `[feature].e2e.test.ts`
-   **Scope**:
    -   Critical business workflows (e.g., Login -> Publish Article -> View Article)
    -   Cross-page interactions
    -   Validation in a real browser environment

### 3.4 Browser Critical Baseline

- `pnpm test:e2e:critical` is the default browser baseline for review and regression.
- `pnpm test:e2e:review-gate --scope=<change>` is the structured evidence entry used by review-gate and regression records.
- Review-gate evidence converges on one run directory containing `manifest.json`, `evidence.md`, `playwright.log`, `playwright-report/`, and `test-results/`.

## 4. Testing Requirements

### 4.1 Frontend Components & Pages

-   **Component Tests**:
    -   Verify that Props are passed correctly.
    -   Verify that Events are emitted correctly.
    -   Verify critical UI state changes (e.g., Loading, Error).
    -   Use `@vue/test-utils` for mounting and interaction simulation.
-   **Page Tests**:
    -   Verify that the page renders correctly.
    -   Verify handling of route parameters (`route.params`, `route.query`).
    -   Verify that SEO metadata (`useHead`) is set correctly.

### 4.2 Backend Interfaces

-   Verify input parameter validation (Zod Schema).
-   Verify successful response format (`code: 200`).
-   Verify error handling for edge cases (e.g., 401, 403, 404).
-   Mock database calls and external services (like email sending) to avoid polluting the development environment.

## 5. Coverage Requirements

-   **Overall Project Target**: **≥ 60%**
-   **Core Modules (Utils, Server API)**: ≥ 80% recommended.
-   **UI Components**: ≥ 50% recommended (focus on logic over styling).
-   Coverage-governance work should preserve or raise the current floor instead of allowing regressions in the name of cleanup.

### 5.1 Coverage Sprint Playbook

1.  Start from a fresh baseline taken from the current `pnpm test:coverage` run or `coverage/coverage-final.json`; do not plan ROI from a stale `coverage-report/coverage-summary.json` artifact.
2.  Before editing tests, estimate the line-gap to the current target and record the baseline, the target line threshold, and the first high-ROI slices to attack.
3.  Prefer high-ROI slices such as large low-coverage modules with existing test scaffolding, stable composables or services, and simple forms before jumping into very large editor surfaces.
4.  After every test edit, rerun the touched test file first. A coverage sprint does not waive targeted validation.
5.  Rerun full `pnpm test:coverage` only when the accumulated expected gain is close to the stage gate or when a new whole-repo checkpoint is needed.
6.  Keep the baseline, gap estimate, targeted checkpoints, and next candidates in [docs/reports/regression/current.md](../../../reports/regression/current.md) so the evidence chain stays reviewable.

Run coverage check:

```bash
pnpm run test:coverage
```

## 6. Efficient Testing Strategy

To balance quality and development speed, especially since full test suites (specifically integration tests) can be slow, follow these tiered guidelines:

1.  **Targeted Testing**:
    -   During local development and bug fixing, **prefer running only tests directly related to the current change**.
    -   **Reason**: Full test suites are slow and frequent runs can block the development flow.
    -   **Command**: `pnpm test [filename_keyword]`.
    -   **Coverage sprint rule**: every newly touched test file must pass in isolation before moving on to the next slice.
2.  **Pre-Commit Check**:
    -   Run relevant tests before pushing to ensure no regressions.
3.  **CI/CD Validation**:
    -   Full test execution is handled by the CI server.

### 6.1 Command Budgets

| Command type | Typical entry | Default timeout budget |
| :--- | :--- | :--- |
| Targeted tests | `pnpm test keyword` / `pnpm exec vitest run path/to/file.test.ts` | 10 minutes |
| Full tests | `pnpm test` | 30 minutes |
| Coverage | `pnpm test:coverage` | 30 minutes |
| Verify | `pnpm verify` | 60 minutes |

Periodic regression should prefer the fixed entries `pnpm regression:weekly`, `pnpm regression:pre-release`, and `pnpm regression:phase-close` instead of mixing ad-hoc bundles of commands.
