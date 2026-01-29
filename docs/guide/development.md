# 开发指南 (Development Guide)

本指南旨在帮助开发者快速搭建墨梅 (Momei) 的本地开发环境，并参与项目的代码贡献。

## 1. 环境准备

在开始之前，请确保你的系统中已安装：

-   **Node.js**: >= 20.x
-   **PNPM**: 推荐使用最新的稳定版
-   **Git**

## 2. 本地搭建

1. **克隆项目**:

    ```bash
    git clone https://github.com/CaoMeiYouRen/momei.git
    cd momei
    ```

2. **安装依赖**:

    ```bash
    pnpm install
    ```

3. **配置环境变量 (可选)**:
   墨梅支持开发环境零配置启动。如果你需要自定义数据库或 AI Key，可以从模板中选择一个复制：

    ```bash
    # 快速开始
    cp .env.example .env
    # 或者查看完整配置
    cp .env.full.example .env
    ```

    修改 `.env` 中的配置。如不配置，系统将默认使用 SQLite 并自动生成开发 Secret。

4. **启动开发服务器**:
    ```bash
    pnpm dev
    ```
    访问 `http://localhost:3000` 即可看到实时生效的改动。

## 3. 开发规范概要

为了保证代码逻辑的一致性，请在开发时遵循以下核心准则：

-   **命名**: 文件使用 `kebab-case`，组件使用 `PascalCase`。
-   **逻辑**: 优先使用 `Early Return`，减少嵌套。
-   **样式**: 使用 SCSS + BEM，严禁使用 `!important`。
-   **国际化**: 所有 UI 文本必须经过 `$t()` 包装。

::: tip 提示
更深入的代码规范、目录结构说明及安全要求，请务必阅读 [**开发规范文档 (Development Standards)**](../standards/development.md)。
:::

## 4. 常用命令

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | 运行 TS/Vue 代码检查 |
| `pnpm lint:css` | 运行样式检查 |
| `pnpm test` | 运行单测 |
| `pnpm typecheck`| 运行类型检查 |

## 5. 参与贡献

1. Fork 本项目。
2. 创建你的特性分支 (`git checkout -b feat/amazing-feature`)。
3. 提交你的更改。
4. 推送到分支 (`git push origin feat/amazing-feature`)。
5. 提交 Pull Request。

---

::: tip 提示
更深入的代码规范细节，请参考 [开发规范文档](../standards/development.md)。
:::
