# 部署指南 (Deployment Guide)

墨梅 (Momei) 遵循 **约定优于配置 (Convention over Configuration)** 的原则。大部分功能在检测到相关密钥时会自动激活，从而尽可能减少环境变量的配置负担。

## 1. 核心环境变量

在生产环境部署时，通常只需要配置以下两个变量即可运行：

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `AUTH_SECRET` | **是** | 认证系统的密钥，长度建议不少于 32 位。 | `j8H2...k9L1` |
| `DATABASE_URL` | 否 | 数据库连接地址。如不填，默认使用本地 SQLite腔。 | `mysql://user:pass@host:3306/db` |

### 1.1 自动推断逻辑 (Smart Inference)

墨梅会根据你的配置自动推断系统行为：

- **数据库类型**: 自动根据 `DATABASE_URL` 的协议头（`mysql://`, `postgres://` 等）推断数据库类型。
- **AI 助手**: 只要配置了 `AI_API_KEY`，相关功能（一键翻译、SEO 优化）会自动激活。
- **对象存储**: 只要配置了 `S3_ACCESS_KEY_ID` 等必要参数，存储引擎会自动切换到 S3 模式。
- **开发模式**: 在 `NODE_ENV=development` 下，`AUTH_SECRET` 会自动生成，数据库默认使用 SQLite，实现零配置开发。

---

## 2. 功能配置参考

以下是各功能模块的详细变量说明：

### 2.1 数据库与管理

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `DATABASE_URL` | 数据库连接地址。 | `sqlite:database/momei.sqlite` |
| `DATABASE_SYNCHRONIZE` | 是否自动同步表结构。生产环境建议为 `false`。 | `false` |
| `ADMIN_USER_IDS` | 管理员用户 ID 列表（逗号分隔）。 | `123123123,456456456` |
| `NUXT_PUBLIC_DEMO_MODE` | 开启演示模式（数据不落盘）。 | `false` |

### 2.2 AI 助手

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `AI_API_KEY` | **设置后自动启用 AI 功能**。 | `sk-xxxx...` |
| `AI_PROVIDER` | AI 服务商 (`openai`, `anthropic`)。 | `openai` |
| `AI_MODEL` | 使用的模型名称。 | `gpt-4o` |
| `AI_API_ENDPOINT` | 自定义 API 地址（如使用代理）。 | `https://api.openai.com/v1` |

### 2.3 邮件系统 (用于订阅与找回密码)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `EMAIL_HOST` | SMTP 服务器地址。 | `smtp.gmail.com` |
| `EMAIL_USER` | SMTP 用户名。 | `user@example.com` |
| `EMAIL_PASS` | SMTP 密码（应用专用密码）。 | `xxxx xxxx xxxx xxxx` |

### 2.4 对象存储 (S3 兼容)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `S3_BUCKET` | 存储桶名称。 | `momei-assets` |
| `S3_ENDPOINT` | 存储节点地址。 | `https://r2.cloudflare.com` |
| `S3_REGION` | 存储所在区域。 | `auto` |

---

## 3. 数据库部署建议

### 3.1 SQLite (默认方案)

最适合个人博客和 Docker/VPS 部署。

- **优势**: 部署简单，无需独立进程。
- **重要**: 必须确保数据目录有持久化挂载。否则，在 **Serverless (如 Vercel)** 环境下，数据将在每次部署或函数超时后归零。
- **SQLite 文件路径**: 若需自定义路径，请在 `DATABASE_URL` 中指定，例如 `sqlite:./data/my-blog.sqlite`。

### 3.2 MySQL / PostgreSQL (生产推荐)

适合多实例运行或对性能、备份有更高要求的场景。

- **自动配置**: 你只需设置 `DATABASE_URL`，系统将检测到 `mysql` 或 `postgres` 驱动并自动初始化。
- **驱动安装**: 墨梅已内置常用驱动库，无需额外操作。

---

## 4. 部署到主流平台

### 4.1 Vercel (推荐)

这是最简便的部署方式。

1. 点击 [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)
2. 填入环境变量 `AUTH_SECRET`。
3. _注意_: Vercel 环境下不支持 SQLite 的持久化。如需保存数据，请填入云数据库（如 Neon 或 TiDB Cloud）的 `DATABASE_URL`。

### 4.2 Docker 部署 (私有服务器)

使用 `docker-compose.yml`:

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-secret-key
        volumes:
            - ./data:/app/database # 持久化存储
```

---

## 5. 管理员账号配置

为了方便初始部署，墨梅提供了两种管理员设置方式：

1.  **首位自动提权 (推荐)**: 系统在安装后，数据库用户表为空时，**第一个成功注册或登录**的账号将自动获得 `admin` 角色。
2.  **环境变量手动提权**: 后续若需添加其他管理员，可通过修改环境变量 `ADMIN_USER_IDS`，填入对应用户的唯一 ID，并以逗号分隔。

---

::: warning 注意
目前暂不支持部署到 **Cloudflare Workers** 或类似边缘环境（由于 TypeORM 和部分底层依赖的兼容性问题）。
:::
