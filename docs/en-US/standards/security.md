---
source_branch: master
last_sync: 2026-02-11
---

# Security Development Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/security.md) shall prevail.
:::

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

## 5. Dependency Security

-   **Regular Updates**: Stay informed about security advisories for dependency packages.
-   **Minimal Dependencies**: Assess the necessity of new packages before adding them. Prefer official or community-recognized secure libraries.

## 6. CLI & Automation Security

When executing any automated scripts or terminal operations, follow these security guidelines:

-   **Environment Check**: Before executing shell commands, check the current OS (Windows, Linux, macOS) and environment (CMD, PowerShell, Bash) to ensure syntax compatibility.
-   **Path Verification**: Explicitly verify the existence and validity of target paths before executing deletion commands (e.g., `rm`, `dir /s`, `rd`).
-   **Empty Path Avoidance**: Never pass empty strings, undefined variables, or high-risk wildcards (e.g., `/*`) as path arguments to deletion commands. High-risk operations similar to `rm -rf /` are strictly prohibited.
