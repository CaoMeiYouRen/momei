---
source_branch: master
last_sync: 2026-08-29
---

# Momei Development Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/development.md) shall prevail.
:::

## 1. Core Principles

- **Modular & Component-based**: Follow high cohesion and low coupling principles to improve maintainability and reusability.
- **Reduced Coupling**: Layer pure functions (pure logic) and side-effect code. Migrate common logic to `utils/**` or reusable hooks. Core modules should have unidirectional, injectable dependencies.
- **High Reusability**: Abstract duplicate logic into composables, directives, or utils. Reduce boilerplate code (forms, API wrappers, validation, etc.).
- **Type Safety**: Fully utilize TypeScript. Strictly forbid `any`. Use `unknown` with Type Guards for uncertain types.
- **Search-First Principle**: When external information, troubleshooting, or hypothesis verification is needed, search tools must be used first for primary-source information. See [AI Collaboration Standards - Search-First](./ai-collaboration.md#14-search-first).
- **Explicit Assumptions**: When requirements, boundaries, input contracts, or runtime prerequisites are unclear, assumptions must be surfaced and clarified first. Proceeding based on default guesses alone is forbidden.
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

### 2.2.1 Comment Standards

- **Comments should explain the important parts**: Prefer comments that explain why the code exists, what constraints apply, and which edge cases or side effects matter, instead of restating the obvious.
- **Complex logic requires comments**: Add concise comments around non-trivial branching, state transitions, compatibility fallbacks, protocol contracts, or security/performance tradeoffs when the intent would otherwise be hard to recover.
- **Function comments are driven by readability**: Add function-level comments when the responsibility, parameter constraints, return semantics, side effects, or cross-layer contract are not obvious from the name alone. Exported functions should usually have a brief purpose comment unless the implementation is trivial and already self-explanatory.
- **Avoid empty or excessive comments**: Do not comment every line, every variable, or every assignment. Avoid comments that merely repeat the type, function name, or literal code.
- **Keep comments in sync with implementation**: Whenever logic changes, update or remove stale comments at the same time. Delete or rewrite drifting comments instead of leaving misleading explanations behind.

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
5.  **File Naming**: Unified kebab-case (e.g. `article-card.vue`).
6.  **SEO**: Use `useHead` or `definePageMeta` for metadata.
7.  **File Line Budget (Check Before Changing)**: Before editing an existing file, verify its current line count against the ESLint `max-lines` ceiling (default 800 globally, relaxed to 1000 for tests; further exemptions live in `eslint.config.js` `lineRuleOverrides`). When the projected addition (logic + JSDoc + comments) leaves too little headroom, **plan in the Plan stage** how to compress (single-line JSDoc, inline intermediate variables, merge array literals) or split the module. Do not let the file cross the ceiling and only then chase it with rework. Line-count compression counts as pure formatting and should be decoupled from logic changes, applied as one final pass (one ESLint + one targeted test). This constraint targets the **per-file** total line count and is distinct from §2.8 commit-scale limits, which target the per-commit diff line count.
8.  **`.mjs` Script Default-Parameter Typing**: Under `allowJs` (e.g. `scripts/**/*.mjs`), a function's default-value-only parameter (e.g. `= []`) is inferred by TypeScript as `never[]`, which makes test files that pass an object array fail with `TS2322` / `TS2353`. Add JSDoc `@param` type annotations (including optional fields) to the `.mjs` function so the caller-side parameter type is correctly inferred.

#### 2.5.0 No Nested `%placeholder`

> **Translator note**: this section mirrors `docs/standards/development.md` § 2.5.1 第四段（"`%placeholder` 嵌套禁止"），kept as a sibling of the SCSS rules because the en-US translation omits the larger § 2.5.1 styling-governance overview. **Do not diverge the substance** — the source is the SCSS `@extend` rule, not a Vue `:class` binding.

-   **Forbidden**: do not nest one `%placeholder` inside another. Sass compiles the inner placeholder to a compound selector (e.g. `%parent %child`), so when a component calls `@extend %child` standalone, it cannot match and the styles are silently dropped (no build warning, no runtime error).
-   **Bad example** (a real project bug): nesting `%auth-card-header` inside `%auth-card`.

    ```scss
    /* ❌ %auth-card-header nested inside %auth-card */
    %auth-card {
        width: 100%;
        // ...

        %auth-card-header {             /* compiles to %auth-card %auth-card-header */
            display: flex;
            align-items: center;
        }
    }

    /* Page-side attempt: */
    .login-card__header {
        @extend %auth-card-header;      /* ❌ no match → styles silently dropped */
    }
    ```

-   **Good example**: keep all `%placeholder` selectors top-level (flat).

    ```scss
    /* ✅ Flat %placeholder shape */
    %auth-card {
        width: 100%;
        // ...
    }

    %auth-card-header {
        display: flex;
        align-items: center;
    }

    /* Page-side extends each placeholder directly: */
    .login-card {
        @extend %auth-card;             /* ✅ matches */
    }
    .login-card__header {
        @extend %auth-card-header;      /* ✅ matches */
    }
    ```

### 2.6 Commit Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/). Provide clear descriptions:

-   `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `chore`.

### 2.7 Atomic Changes

1.  **Atomicity**: Each change should correspond to **one** atomic item in the [Todo List](../../../plan/todo.md).
2.  **Scale Control**: Keep changes focused; ideally **not more than 10 files per commit** and the new lines per commit should in principle stay under **800**.
3.  **Over-budget Rejection / Re-split**: When an audit's diff size exceeds the thresholds above (10 files or 800 new lines), the reviewer (`@code-auditor`) must demand a justification for the batch split; if the change is not split and there is no valid reason, the audit verdict is **Reject** and the work must be split and re-submitted (in concurrent partitioned audits the per-partition sizes sum up for the merged judgement).
4.  **Single Functionality**: If modifying multiple features, split into separate commits.
5.  **Large-Task Splitting**: For large refactors or complex features, decompose into multiple small atomic changes and commit them separately.
6.  **Local Checks**: Run Lint + Typecheck + Test before committing.

### 2.7.1 Comment Hygiene

- **Function-level comments prefer JSDoc**: For exported or widely reused functions with non-obvious behaviour, prefer a short JSDoc block (purpose, edge cases, return semantics, side effects). Do not repeat types or function names verbatim.
- **No garbage or noise comments**: Do not annotate every line, every variable, or every assignment. Do not produce comments that merely restate the type, name, or literal code.
- **Comments must track the implementation**: When you change behaviour, update or delete the corresponding comment in the same patch. A comment that no longer describes what the code does must be deleted or rewritten, never drifted.
- **No leftover planning IDs**: Comments and test names (including `it('...')` descriptions) must not carry planning / task / audit identifiers (e.g. `T405`, `P1-1`, `RG-B01`, `Phase 66`, "Candidate #14", including the Chinese-colon variants). Allowed exceptions: real in-code constants (such as `E401`), and **navigation pointers with a doc path or section name** (e.g. "see `docs/plan/todo.md`『Known Gap G2』"). Lone orphan IDs must be cleaned; keep only the explanatory prose after the ID.

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

## 5.1 Review Expectations

- Every change must go through at least one review before commit.
- For code changes, review must also assess whether comments are sufficient, accurate, and proportionate, with extra attention on complex logic and exported functions.
- Stale, misleading, line-by-line, or otherwise low-value comments should be treated as review findings instead of being ignored.

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
