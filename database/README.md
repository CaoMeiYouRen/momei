# 数据库目录 (Database)

本目录用于存放墨梅 (Momei) 博客的数据库相关资源和初始化脚本。

## 目录结构

-   `sqlite/`: 存放 SQLite 初始化脚本及默认生成的 `.sqlite` 数据库文件。
-   `mysql/`: 存放 MySQL 初始化 SQL 脚本。
-   `postgres/`: 存放 PostgreSQL 初始化 SQL 脚本。

## 初始化脚本说明

**出于数据安全考虑，墨梅在生产环境模式下默认不会自动同步数据库表结构（`synchronize: false`）。**

为了确保数据一致性，我们强烈建议您手动执行本目录下的 SQL 脚本来初始化生产数据库。系统仅在以下场景会自动开启同步：
1. 开发环境 (`NODE_ENV=development`)。
2. Demo 模式 (`DEMO_MODE=true`)。
3. 测试环境 (`vitest`)。
4. 显式设置环境变量 `DATABASE_SYNCHRONIZE=true`。

1.  **SQLite**:
    -   脚本：`sqlite/init.sql`
    -   适用于轻量级部署。
2.  **MySQL**:
    -   脚本：`mysql/init.sql`
    -   适用于中大型部署 (兼容 MariaDB)。
3.  **PostgreSQL**:
    -   脚本：`postgres/init.sql`
    -   **推荐生产环境使用**。
    -   **注意**: 脚本已统一使用 `timestamptz(6)` (带时区的 timestamp)，以确保国际化支持和多时区部署的准确性。

### 脚本包含内容

所有脚本均包含以下核心组件：

1.  **用户中心 (Auth)**: 用户 (`momei_user`)、账号 (`momei_account`)、会话 (`momei_session`)、验证码 (`momei_verification`)。
2.  **安全增强**: 二步验证 (`momei_two_factor`)、密钥 JWKS (`momei_jwks`)、API 密钥 (`momei_api_key`)。
3.  **博客内容**: 文章 (`momei_post`)、分类 (`momei_category`)、标签 (`momei_tag`) 及其关联关系。
4.  **性能优化**: 为常用查询字段（如 `author_id`, `category_id`, `slug` 等）预设了索引。

## 详细配置指南

关于如何在不同环境下配置数据库连接，请参考文档站：
[**数据库部署指南**](https://docs.momei.app/guide/deploy#_2-数据库部署详情)

---

::: tip 提示
生产环境下，建议关闭 `synchronize` 并通过这些 SQL 脚本或迁移工具来管理表结构变更。
:::
