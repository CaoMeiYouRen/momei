---
source_branch: master
last_sync: 2026-02-11
---

# Momei Development Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/development.md) shall prevail.
:::

## 1. Core Principles

- **Modular & Component-based**: Follow high cohesion and low coupling principles to improve maintainability and reusability.
- **Reduced Coupling**: Layer pure functions (pure logic) and side-effect code. Migrate common logic to `utils/**` or reusable hooks. Core modules should have unidirectional, injectable dependencies.
- **High Reusability**: Abstract duplicate logic into composables, directives, or utils. Reduce boilerplate code (forms, API wrappers, validation, etc.).
- **Type Safety**: Fully utilize TypeScript. Strictly forbid `any`. Use `unknown` with Type Guards for uncertain types.
- **Minimal Change Principle**: Focus on the target itself when modifying code. Minimize impact on unrelated code to avoid side effects.
- **Pragmatism First**: Avoid over-engineering. Evaluate the real value and cost (ROI analysis) before introducing new features or refactoring.

## 2. Code Style & Standards

### 2.1 Naming Conventions

- **File Naming**: Use **kebab-case** (lowercase + hyphens), e.g., `article-card.vue`, `date-utils.ts`.
- **Utility Functions**: Clear and descriptive names starting with a verb, e.g., `formatDate`, `getUserById`.
- **Schemas & Types**: Use **PascalCase**, e.g., `UserProfile`, `ArticleSchema`. Schema fields should use **camelCase**.

### 2.2 Logic Control

- **Early Return**: End function execution early using `return` to reduce `if/else` nesting and keep code flat.
- **Complexity Control**: Regularly review Cyclomatic Complexity to avoid over-long functions and deep nesting.
- **Planning Standards**: Follow [Project Planning Standards](./planning.md) for roadmap and task estimation.

### 2.3 Style Standards (CSS/SCSS)

- **Reuse First**: Prioritize global variables and mixins defined in `assets/styles`.
- **Consistency**: Ensure styles align with the UI design document (`../design/ui.md`).
- **No `!important`**: Strictly forbidden in components and global styles.
    - Reason: It breaks CSS specificity and makes maintenance difficult.
    - Exception: Permitted in uncontrollable third-party style overrides or **Email templates** (MJML/Email HTML).
    - **Requirement**: If its use is absolutely necessary, the reason must be documented in comments and **prior approval must be obtained from the project architect**.
- **Pure SCSS**: Prohibit CSS-in-JS (e.g., `styled-components`, `tailwind`). All styles must be written in pure SCSS.

### 2.4 Directory Structure & Dependencies

- **Structure**:
    - `components/`, `pages/`, `styles/`, `public/`, `plugins/`, `middleware/`, `composables/`, `layouts/`, `libs/`, `types/`, `tests/`, `utils/`.
    - `utils/shared/`: Pure functions/constants for both frontend and backend. No dependency on Nuxt/Node.
    - `utils/web/`: Client-side logic (Browser APIs, UI helpers).
    - `server/`: Server-side code (API routes, middleware, DB utils).
- **Dependency Constraints**:
    - `shared` **cannot** import from `web` or `server`.
    - `web` can import from `shared`, but not vice versa.
    - `server` can import from `shared`, but not vice versa.
    - **Barrel Files**: Use `index.ts` to expose clean entries and prevent cross-layer accidental imports.

### 2.5 Code Generation Guidelines (for AI)

AI must follow these conventions:

1.  **TypeScript Preferred**: Define interfaces/types; avoid `any`.
2.  **Vue Style**: Use `<script setup lang="ts">` and Composition API.
3.  **SCSS Standards**: Use kebab-case for filenames, follow BEM naming, no inline styles.
4.  **Internationalization (i18n)**: All UI text must use `$t()`. I18n keys should use **snake_case** (except legacy kebab-case).
5.  **SEO**: Use `useHead` or `definePageMeta` for metadata.

### 2.6 Commit Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/). Provide clear descriptions:

-   `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `chore`.

### 2.7 Atomic Changes

1.  **Atomicity**: Each change should correspond to **one** atomic item in the [Todo List](../../plan/todo.md).
2.  **Scale Control**: Keep changes focused; ideally **not more than 10 files** per commit.
3.  **Single Functionality**: If modifying multiple features, split into separate commits.
4.  **Local Checks**: Run Lint + Typecheck + Test before committing.

## 3. Tech Stack & Libraries

| Category       | Recommended Library/Method | Description                                                           |
| :------------- | :------------------------- | :-------------------------------------------------------------------- |
| **Navigation** | `navigateTo`               | Use Nuxt standard instead of `router.push`.                           |
| **API Request**| `useFetch` / `$fetch`      | `useFetch` for SSR; `$fetch` for client-side purely.                  |
| **Date Time**  | `useI18nDate` / `dayjs`    | `useI18nDate` in templates; `dayjs` in logic.                         |
| **Utilities**  | `lodash-es`                | For array/object manipulation, debouncing, etc.                       |
| **Admin List** | `useAdminList`             | Required for all admin table states.                                  |
| **Filesystem** | `fs-extra`                 | Enhanced Promise support over native `fs`.                            |

## 4. Security

- **XSS Protection**: Sanitize user inputs rendered as HTML. Be extremely careful with `v-html`.

## 5. Configuration Access

Avoid using `process.env` directly in business logic (except for `DATABASE_URL`).

- **Server**: Use `server/services/setting.ts` via `getSetting(key)`.
- **Frontend**: Use `useMomeiConfig()` composable.

## 6. Code Examples

### 6.1 Vue Component Template

```vue
<template>
    <div class="article-card">
        <h2 class="article-card__title">
            {{ $t("components.title") }}
        </h2>
        <slot />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

defineProps<{
    title?: string;
}>();
</script>

<style lang="scss" scoped>
.article-card {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #fff;

    &__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
    }
}

// Dark mode
:global(.dark) .article-card {
    background-color: #1f2937;

    &__title {
        color: #fff;
    }
}
</style>
```

### 6.2 API Route Template

```typescript
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        // Business logic...
        return {
            code: 200,
            data: [],
        };
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }
});
```
