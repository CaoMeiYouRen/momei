---
source_branch: master
last_sync: 2026-02-11
---

# API Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/api.md) shall prevail.
:::

## 1. Overview

This document defines the general standards for the Momei blog backend interfaces, including response formats, status codes, authentication mechanisms, and parameter validation rules. All API development must follow these standards.

### 1.1 HTTP Methods

To maintain consistency and simplicity, the project permits only the following four standard HTTP methods:

-   **GET**: Retrieve resources (Idempotent).
-   **POST**: Create new resources.
-   **PUT**: Update existing resources (Full or partial updates).
-   **DELETE**: Delete resources.

**PATCH is strictly prohibited**. All partial update requests must be handled using the PUT method.

## 2. Unified Response Format

All API interfaces (except for specific streaming interfaces or file downloads) must follow a unified JSON response format.

```typescript
interface ApiResponse<T = any> {
    code: number; // Business status code, 200 for success, non-200 for exceptions
    message: string; // Status description or error message
    data?: T; // Data returned on success
}
```

### 2.1 Status Codes

| Code | Description                |
| :--- | :------------------------- |
| 200  | Success                    |
| 400  | Bad Request                |
| 401  | Unauthorized               |
| 403  | Forbidden                  |

### 2.2 Pagination Format

For list interfaces, results must be wrapped using the `paginate` utility function to return a unified pagination structure.

```typescript
interface PaginatedData<T> {
    items: T[]; // List of data (always use 'items', never 'list')
    total: number; // Total item count
    page: number; // Current page number
    limit: number; // Items per page
    totalPages: number; // Total page count
}

// Final Response
interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}
```

## 3. Authentication & Authorization Standards

-   **Framework**: Must use [better-auth](https://github.com/better-auth/better-auth).
-   **Session Management**: Must use cookie-based session mechanisms to support SSR environments.
-   **Statelessness**: APIs should remain as stateless as possible, relying on session cookies for identity.
-   **Authorization Checks**: Manual session handling or complex role logic in API Handlers is prohibited. Use pre-defined utility functions in `server/utils/permission.ts`:
    -   `requireAuth(event)`: Check if the user is logged in.
    -   `requireAdmin(event)`: Check if the user is an administrator.
    -   `requireAdminOrAuthor(event)`: Check if the user is an administrator or author.
    -   `requireRole(event, roles)`: Check if the user has a specific role.

## 4. Validation Standards

All input parameters (Query, Body, Params) must be defined and validated using **Zod** schemas.

```typescript
// Example: Create article validation
const createPostSchema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
});
```

## 5. Email Service Standards

-   **Provider**: Use **Nodemailer** as the unified email sending interface.
-   **Configuration**: Prefer configuring via system settings (database) or environment variables. Hardcoding credentials in code is prohibited.
-   **Templates**: Must use HTML email templates to ensure cross-client compatibility.

### 5.1 Email Internationalization (i18n)

-   **Scope**: All system emails (verification, notifications, subscriptions) must support multiple languages.
-   **Language Resolution**:
    - For logged-in users, use their `preferredLanguage` field (planned).
    - For guests (e.g., registration), resolve from request parameters, cookies, or system defaults.
-   **Local Storage**: Email localized strings must be stored in `server/utils/email/locales/`, separate from frontend i18n. Currently supports `zh-CN` and `en-US`.
-   **API Signature**: All email sending methods must support an optional `locale` parameter:
    ```typescript
    sendVerificationEmail(email: string, url: string, locale?: string): Promise<void>
    ```
    Unsupported languages will automatically fallback to `zh-CN`.
