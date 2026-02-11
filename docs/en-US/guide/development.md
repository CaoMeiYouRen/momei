---
source_branch: master
last_sync: 2026-02-11
---

# Development Guide

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
| `pnpm lint:css` | Run style linting |
| `pnpm test` | Run unit tests |
| `pnpm typecheck`| Run type checking |

## 5. Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes.
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.
