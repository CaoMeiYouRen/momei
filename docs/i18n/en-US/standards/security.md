---
source_branch: master
last_sync: 2026-08-29
translation_tier: summary-sync
---

# Security Development Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/security.md) shall prevail.
:::

## 0. Source & Scope

- `AGENTS.md` remains the project-level security red line source.
- This page is the implementation summary for security development details.
- The permission implementation authority is `server/utils/permission.ts`, especially `requireAuth`, `requireAdmin`, `requireAdminOrAuthor`, `requireRole`, and their WebSocket variants (`requireWsAuth`, `requireWsRole`, `requireWsAdminOrAuthor`).

## 1. Authentication & Authorization

-   **Strict Authentication**: All APIs involving user data must validate the `session` through `auth.global.ts` or specific route middleware.
-   **Principle of Least Privilege**: Strictly differentiate between role permissions. Since a user may have multiple roles (comma-separated), direct equality checks like `role === 'admin'` are forbidden. Use inclusion utility functions like `hasRole(role, 'admin')` or `isAdmin(role)`.
-   **Password Security**: Never store plaintext passwords in the database. Use the secure hashing mechanisms provided by Better-Auth.

## 2. Data Security

-   **Input Validation**: All API inputs must be schema-validated using `zod` or similar tools. Never trust results from `getQuery` or `readBody` directly.
-   **Injection Prevention**: Use Drizzle ORM or similar tools for parameterized queries. Concatenating SQL strings is strictly prohibited.
-   **Sensitive Information Masking**: Mask sensitive data (e.g., partial email masking, removing password fields) before returning API results.
-   **Secrets Management**: Never commit API keys, database passwords, or other secrets to Git. Use `.env` files and declare them in `nuxt.config.ts`.

## 3. Web Protection

-   **XSS Protection**: Rely on Vue's default template escaping. Any use of `v-html` must undergo strict auditing.
-   **CSRF Protection**: Ensure necessary CSRF token validation is enabled or use SameSite cookie policies.
-   **CORS Policy**: Configured `Access-Control-Allow-Origin: *` is strictly prohibited in production environments.

## 4. Logging & Monitoring

-   **Audit Logging**: Important operations (login, deletions, permission changes) must be recorded in audit logs.
-   **No Sensitive Data in Logs**: Logs must not contain passwords, tokens, or detailed identification credentials.

## 5. Dependency & Supply Chain Security

### 5.1 Dependency Auditing

-   **Regular Updates**: Track dependency security advisories (Dependabot / `pnpm audit`) and prioritise high-severity findings.
-   **Minimal Dependencies**: Assess the necessity of new packages before adding them; prefer official or community-recognised secure libraries.
-   **CI Integration**: Dependency auditing must live in CI or a recurring regression job; local spot-checks are not a substitute for pipeline checks.

### 5.2 Supply Chain Trust Boundary

Before adopting a new dependency, MCP server, external skill/agent, or AI-recommended package, perform source verification. Do not assume trust:

1.  **AI-recommended package verification**: A non-trivial fraction of AI-recommended packages do not exist in the official registry (package hallucinations: at least 5.2% of commercial models and 21.7% of open-source models in *We Have a Package for You! A Comprehensive Analysis of Package Hallucinations in Code-Generating LLMs*, Spracklen et al., arXiv:2406.10279, USENIX Security 2025). Verify the package actually exists in the registry, check spelling for typosquatting (e.g. `lodahs` vs `lodash`), and never install by name alone.
2.  **Pin versions + lockfile**: Dependencies must be pinned and committed with a lockfile (`pnpm-lock.yaml`). Tooling versions in CI / Dockerfile / automation scripts must use immutable versions (git tag / SHA), never floating tags.
3.  **External skill / agent / MCP source verification**: Before pulling in an external skill, agent, or MCP server, verify the source repository URL and the maintaining organisation are trustworthy subjects. Be alert to vectors that disguise themselves as "helpful docs / skills" (TrustFall lessons); full pre-source checks live in [AI Asset Governance §2.2](../../../standards/ai-governance.md#22-外部同步或平台提供资产).
4.  **Dependency direction constraints**: When adding internal packages or dependencies, follow the one-way dependency constraints in [Development Standards §2.4 Directory Structure & Dependencies](./development.md#24-directory-structure--dependencies). Circular dependencies and cross-layer application dependencies are forbidden.

## 6. CLI & Automation Security

When executing any automated scripts or terminal operations, follow these security guidelines:

-   **Environment Check**: Before executing shell commands, check the current OS (Windows, Linux, macOS) and environment (CMD, PowerShell, Bash) to ensure syntax compatibility.
-   **Path Verification**: Explicitly verify the existence and validity of target paths before executing deletion commands (e.g., `rm`, `dir /s`, `rd`).
-   **Empty Path Avoidance**: Never pass empty strings, undefined variables, or high-risk wildcards (e.g., `/*`) as path arguments to deletion commands. High-risk operations similar to `rm -rf /` are strictly prohibited.

Practical additions from the current Chinese source:

- Treat platform/runtime detection as mandatory before running destructive CLI automation.
- Prefer safe path validation over assumed working-directory context.
- Do not treat infrastructure-only concerns such as WAF/CDN configuration as if they were application-code security rules.
