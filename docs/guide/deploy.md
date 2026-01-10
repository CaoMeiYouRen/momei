# 部署指南 (Deployment Guide)

墨梅 (Momei) 基于 Nuxt 3 开发，支持多种部署环境。你可以根据自己的需求选择合适的方案。

## 1. 环境变量配置

在部署前，请确保配置好以下环境变量。你可以在项目根目录下创建 `.env` 文件或在部署平台（如 Vercel）中进行配置。

| 变量名                 | 说明                                       | 示例                             |
| :--------------------- | :----------------------------------------- | :------------------------------- |
| `DATABASE_TYPE`        | 数据库类型 (`sqlite`, `mysql`, `postgres`) | `sqlite`                         |
| `DATABASE_PATH`        | SQLite 数据库文件的路径 (仅 SQLite 使用)   | `database/momei.sqlite`          |
| `DATABASE_URL`         | 数据库连接 URL (MySQL/PostgreSQL 使用)     | `mysql://user:pass@host:3306/db` |
| `NUXT_PUBLIC_SITE_URL` | 站点正式域名                               | `https://momei.app`              |
| `AUTH_SECRET`          | 认证系统的密钥                             | `your-secret-key`                |
| `ADMIN_EMAIL`          | 初始管理员邮箱                             | `admin@example.com`              |
| `ADMIN_PASSWORD`       | 初始管理员密码                             | `admin123456`                    |
| `DATABASE_SYNCHRONIZE` | 是否自动同步表结构 (生产环境慎用)          | `false`                          |

## 2. 数据库部署详情

墨梅支持多种数据库，你可以根据业务规模选择。

### 2.1 SQLite (默认/轻量)

适用于小型博客或测试环境。

-   **配置**: 设置 `DATABASE_TYPE=sqlite` 和 `DATABASE_PATH`。
-   **初始化**: **生产环境推荐手动执行 `database/sqlite/init.sql` 以创建初始表结构。**
-   **同步**: 开发环境 (`NODE_ENV=development`) 默认会自动同步。但在生产环境模式下，必须通过设置 `DATABASE_SYNCHRONIZE=true` 才会开启自动同步。
-   **注意**: 部署在 Docker 或 VPS 时，务必将数据库文件所在的目录挂载为持久化卷，否则重启后数据会丢失。

### 2.2 MySQL / PostgreSQL (推荐用于生产)

适用于需要高可用性和数据备份的大型博客。

-   **配置**: 设置 `DATABASE_TYPE=mysql` (或 `postgres`) 以及 `DATABASE_URL`。
-   **初始化**: 手动执行 `database/mysql/init.sql` (或 `database/postgres/init.sql`) 以创建初始表结构。
-   **示例 URL**:
    -   MySQL: `mysql://root:password@localhost:3306/momei`
    -   Postgres: `postgres://user:password@localhost:5432/momei`
-   **SSL**: 如果数据库要求 SSL 连接，设置 `DATABASE_SSL=true`。

## 3. 部署到主流平台

### 3.1 Vercel / Netlify

这是最推荐的部署方式，能够利用边缘计算和自动构建。

1. **Vercel**: GitHub 关联项目后，Vercel 会自动识别 Nuxt 3 项目。
    - 开发平台：GitHub
    - 构建命令：`npm run build`
    - 输出目录：`.output`
2. **Netlify**: 逻辑与 Vercel 类似。

### 3.2 Docker 部署 (私有服务器)

如果你有自己的 VPS 或服务器，建议使用 Docker 部署。

#### 构建自定义镜像

```bash
docker build -t my-momei-blog .
```

#### 运行容器

```bash
docker run -d --name momei \
  -p 3000:3000 \
  -e DATABASE_TYPE=sqlite \
  -e DATABASE_PATH=/app/data/momei.sqlite \
  -v /path/to/data:/app/data \
  my-momei-blog
```

## 4. 部署到专用服务器 (Node.js)

如果你希望直接运行构建产物：

1. **构建项目**:
    ```bash
    pnpm build
    ```
2. **启动生产服务器**:
    ```bash
    node .output/server/index.mjs
    ```
    _建议配合 PM2 进行进程管理：_
    ```bash
    pm2 start .output/server/index.mjs --name momei-blog
    ```

## 5. 数据库说明

墨梅默认使用 **SQLite** 数据库，方便快速启动且无需额外部署。

-   数据库文件路径建议设置为 `./data/` 目录下，并确保该目录具有读写权限。
-   如果是 Docker 部署，请务必挂载 `/app/data` 卷以持久化存储数据。

---

::: warning 注意
目前暂不支持部署到 **Cloudflare Workers** 或类似边缘环境（由于 TypeORM 和部分底层依赖的兼容性问题）。
:::
