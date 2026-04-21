---
source_branch: master
last_sync: 2026-04-21
translation_tier: summary-sync
---

# Development Guide

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/development.md) shall prevail.
:::

This guide is designed to help developers quickly set up the local development environment for Momei and contribute code to the project.

## 1. Prerequisites

Ensure the following are installed on your system:

-   **Node.js**: >= 20.x
-   **PNPM**: Latest stable version recommended.
-   **Git**

## 2. Local Setup

1. **Clone the Project**:

    ```bash
    git clone https://github.com/CaoMeiYouRen/momei.git
    cd momei
    ```

2. **Install Dependencies**:

    ```bash
    pnpm install
    ```

3. **Configure Environment Variables (Optional)**:
   Momei supports Zero-Config startup for development. If you need to customize the database or AI keys, you can copy from the templates:

    ```bash
    # Minimal version
    cp .env.example .env
    # Full version
    cp .env.full.example .env
    ```

    Editing `.env` is optional; without it, the system defaults to SQLite and generates a development secret automatically.
    For values that can also be managed in the admin settings center, prefer the environment variable names that match the mapping used by `server/services/setting.ts`, such as `AI_QUOTA_ENABLED`, `AI_QUOTA_POLICIES`, `ASSET_PUBLIC_BASE_URL`, `ASSET_OBJECT_PREFIX`, `MEMOS_INSTANCE_URL`, and `MEMOS_ACCESS_TOKEN`.

4. **Start Development Server**:
    ```bash
    pnpm dev
    ```
    Visit `http://localhost:3000` to see your changes in real-time.

## 3. Development Summary

To ensure consistency, please follow these core guidelines:

-   **Naming**: Files use `kebab-case`, components use `PascalCase`.
-   **Logic**: Prefer `Early Returns` to minimize nesting.
-   **Styles**: Use SCSS with BEM. Using `!important` is prohibited.
-   **i18n**: All UI strings must be wrapped in `$t()`.

::: tip
For deeper insights into code standards, directory structure, and security requirements, please read the [**Development Standards**](../standards/development.md).
:::

## 4. Useful Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run TS/Vue linting |
| `pnpm lint:i18n` | Run `@intlify/vue-i18n` slow rules separately |
| `pnpm lint:css` | Run style linting |
| `pnpm i18n:audit` | Audit i18n keys and module split status |
| `pnpm i18n:audit:missing` | Fail fast when locale parity is missing |
| `pnpm i18n:audit:unused` | Review cleanup candidates without turning them into a default blocker |
| `pnpm regression:weekly` | Run the fixed weekly regression entry for coverage, dependency risk, docs source-of-truth, i18n checks, and duplicate-code baseline |
| `pnpm regression:pre-release` | Run the fixed pre-release regression entry, including release checks and perf budgets |
| `pnpm regression:phase-close` | Run the phase-close regression entry before archive rotation and stage close |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm test:e2e:critical` | Run the minimal browser critical baseline |
| `pnpm test:e2e:review-gate --scope=<change>` | Capture review-gate browser evidence, traces, and `manifest.json` under `artifacts/testing/ui-regression/` |
| `pnpm typecheck`| Run type checking |
| `pnpm deploy:wrangler` | Debug wrangler-side integration; not a supported full-site Cloudflare deployment path |

`pnpm test:e2e` and `pnpm test:e2e:critical` now verify that `.output/server/index.mjs` is not older than the source tree before they start, so browser validation does not silently reuse a stale build.

The regression flow is intentionally fixed around three entries instead of ad-hoc command bundles:

- `pnpm regression:weekly`
- `pnpm regression:pre-release`
- `pnpm regression:phase-close`

If `docs/reports/regression/current.md` exceeds the active-window limit, the phase-close entry stops and requires archive rotation before it can pass.

## 5. Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes.
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.
