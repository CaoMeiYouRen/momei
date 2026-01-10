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

3. **配置本地变量**:
   复制模板文件：

    ```bash
    cp .env.example .env
    ```

    修改 `.env` 中的数据库路径或其他配置。

4. **启动开发服务器**:
    ```bash
    pnpm dev
    ```
    访问 `http://localhost:3000` 即可看到实时生效的改动。

## 3. 开发流程

### 3.1 增加新页面/组件

-   页面存放在 `pages/` 目录下，文件命名遵循 `kebab-case`。
-   公用组件存放在 `components/` 目录下，使用大驼峰式 (PascalCase) 命名（符合 Vue 官方规范）。

### 3.2 修改样式

-   全局样式在 `assets/styles/main.scss` 中。
-   组件样式使用 `<style lang="scss" scoped>`。
-   遵循 **BEM** 命名规范（例如：`.article-card__title`）。

### 3.3 文档编写

-   文档存放在 `docs/` 目录下，由 VitePress 驱动。
-   在修改代码的同时，请务必同步更新相关的文档资产。

## 4. 测试与规范

### 4.1 代码检查

提交 PR 之前请务必运行 lint 检查：

```bash
# 检查 TS 代码
pnpm lint

# 检查样样式
pnpm lint:css
```

### 4.2 运行测试

项目使用 Vitest 进行单元测试和集成测试：

```bash
pnpm test
```

### 4.3 提交规范

我们遵循 **Conventional Commits** 规范。提交信息格式：`类型: 描述`（请使用中文）。

-   `feat`: 新特性
-   `fix`: 修复问题
-   `docs`: 文档变更
-   `style`: 代码格式修正
-   `refactor`: 重构代码

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
