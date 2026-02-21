# 部署指南 (Deployment Guide)

墨梅 (Momei) 遵循 **约定优于配置 (Convention over Configuration)** 的原则。大部分功能在检测到相关密钥时会自动激活，从而尽可能减少环境变量的配置负担。

## 1. 核心环境变量

墨梅提供了两个示例文件供参考：
-   [**.env.example**](../../.env.example): 极简版，仅包含快速启动所需的最小配置。
-   [**.env.full.example**](../../.env.full.example): 完整版，包含所有可用的功能配置项。

在生产环境部署时，通常只需要配置以下两个变量即可运行：

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `AUTH_SECRET` | **是** | 认证系统的密钥，长度建议不少于 32 位。 | `j8H2...k9L1` |
| `DATABASE_URL` | 否 | 数据库连接地址。如不填，默认使用本地 SQLite 路径。 | `mysql://user:pass@host:3306/db` |

### 1.1 自动推断逻辑 (Smart Inference)

墨梅会根据你的配置自动推断系统行为：

- **数据库类型**: 自动根据 `DATABASE_URL` 的协议头（`sqlite://`, `file://`, `mysql://`, `postgres://` 等）推断数据库类型。
- **AI 助手**: 只要配置了 `AI_API_KEY`，相关功能（一键翻译、SEO 优化）会自动激活。
- **开发模式**: 在 `NODE_ENV=development` 下，`AUTH_SECRET` 会自动生成，数据库默认使用 SQLite，实现零配置开发。

---

## 2. 功能配置参考

以下是各功能模块的详细变量说明：

### 2.1 数据库与管理

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `DATABASE_URL` | 数据库连接地址。推荐使用 `sqlite://` 前缀。 | `sqlite://database/momei.sqlite` |
| `DATABASE_SYNCHRONIZE` | 是否自动同步表结构。生产环境建议为 `false`。 | `false` |
| `REDIS_URL` | Redis 连接地址 (可选，用于更高性能的缓存)。 | `redis://localhost:6379` |
| `ADMIN_USER_IDS` | 管理员用户 ID 列表（逗号分隔）。 | `123123123,456456456` |
| `NUXT_PUBLIC_DEMO_MODE` | 开启演示模式（数据不落盘）。 | `false` |

### 2.2 AI 助手 (Multimodal AI)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `AI_API_KEY` | **设置后自动启用 AI 创作功能**。 | `sk-xxxx...` |
| `AI_PROVIDER` | AI 服务商 (`openai`, `anthropic`, `deepseek`, `doubao`, `siliconflow`)。 | `openai` |
| `AI_MODEL` | 使用的模型名称。 | `gpt-4o`, `deepseek-chat`, `claude-3-5-sonnet-20240620` |
| `AI_API_ENDPOINT` | 自定义 API 地址（如使用代理）。 | `https://api.openai.com/v1` |
| `AI_IMAGE_PROVIDER` | AI 绘图服务商 (`dall-e-3`, `seedream`, `siliconflow`)。 | `seedream` |
| `TTS_PROVIDER` | TTS 提供商 (`openai`, `siliconflow`)。 | `siliconflow` |
| `ASR_PROVIDER` | ASR 提供商 (`openai`, `siliconflow`, `volcengine`)。 | `siliconflow` |
| `VOLCENGINE_APP_ID` | 火山引擎 App ID (用于语音/ASR)。 | `xxxxxxxx` |
| `AI_IMAGE_API_KEY` | AI 绘图专用 API KEY (可选，默认复用 `AI_API_KEY`)。 | `sk-xxxx...` |
| `AI_IMAGE_API_ENDPOINT` | AI 绘图 API 地址（可选）。 | `https://api.openai.com/v1` |
| `AI_IMAGE_MODEL` | 绘图模型 ID。 | `dall-e-3`, `Seedream-2.0` |

### 2.3 邮件系统 (用于订阅与找回密码)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `EMAIL_HOST` | SMTP 服务器地址。 | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP 服务器端口。 | `587` |
| `EMAIL_USER` | SMTP 用户名。 | `user@example.com` |
| `EMAIL_PASS` | SMTP 密码（应用专用密码）。 | `xxxx xxxx xxxx xxxx` |
| `EMAIL_SECURE` | 是否使用 SSL/TLS。 | `false` |
| `EMAIL_FROM` | 邮件发送者地址 (包含显示名称)。 | `Momei Blog <admin@example.com>` |

### 2.4 对象存储 (Storage)

墨梅支持多种存储后端，默认为 `local`。你可以通过 `STORAGE_TYPE` 进行切换。

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `STORAGE_TYPE` | 存储引擎 (`local`, `s3`, `vercel-blob`)。 | `local` |
| `BUCKET_PREFIX` | 文件上传后的路径前缀。 | `momei/` |
| `NUXT_PUBLIC_MAX_UPLOAD_SIZE` | 最大允许上传的文件大小。 | `10MB` (默认 4.5MiB) |

::: tip 提示
如果你使用 Docker 部署并选择 `STORAGE_TYPE=local`，请务必挂载对应的上传目录（详见第 4.2 节），否则在容器重启或重新部署后，已上传的文件将会丢失。
:::

#### 2.4.1 S3 兼容存储 (STORAGE_TYPE=s3)

适用于 Cloudflare R2, AWS S3, MinIO 等。

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `S3_REGION` | S3 区域（必填）。 | `auto` |
| `S3_BUCKET_NAME` | 存储桶名称（必填）。 | `momei-assets` |
| `S3_ACCESS_KEY_ID` | S3 Access Key（必填）。 | `xxxx...` |
| `S3_SECRET_ACCESS_KEY` | S3 Secret Key（必填）。 | `xxxx...` |
| `S3_ENDPOINT` | S3 兼容服务的端点（可选）。 | `https://<id>.r2.cloudflarestorage.com` |
| `S3_BASE_URL` | 生成的公共访问 URL 前缀（可选）。 | `https://pub-xxxx.r2.dev` |

#### 2.4.2 Vercel Blob 存储 (STORAGE_TYPE=vercel-blob)

适用于部署在 Vercel 上的项目。

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 令牌。 | `vercel_blob_rw_...` |

#### 2.4.3 本地存储 (STORAGE_TYPE=local)

**注意**: 不支持 Serverless 环境（如 Vercel）。

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `LOCAL_STORAGE_DIR` | 本地文件保存目录。 | `public/uploads` |
| `LOCAL_STORAGE_BASE_URL` | 公开访问的基础 URL 路径。 | `/uploads` |
| `LOCAL_STORAGE_MIN_FREE_SPACE` | 磁盘最小剩余空间（阻止写入）。 | `100MiB` |

### 2.5 Memos 同步

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `MEMOS_API_URL` | Memos 实例的基础地址 (v1 API)。 | `https://memos.example.com` |
| `MEMOS_API_KEY` | Memos 的访问令牌。 | `eyJhbGci...` |

### 2.6 定时任务与自动化 (Automation)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `TASKS_TOKEN` | 用于触发内部定时任务的鉴权令牌（建议设为长随机字符串）。 | `super-secret-token-123` |
| `TASKS_CRON_SCHEDULE` | 本地执行 Cron 任务的表达式（可选，需环境支持）。 | `0 0 * * *` (每天零点) |

---

## 3. 站点与合规配置

### 3.1 基础站点配置

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_SITE_URL` | 站点正式 URL。 | `https://momei.app` |
| `NUXT_PUBLIC_AUTH_BASE_URL` | 认证系统的 API 基础路径。 | `https://momei.app/api/auth` |
| `NUXT_PUBLIC_APP_NAME` | 站点名称。 | `墨梅博客` |
| `NUXT_PUBLIC_SITE_OPERATOR` | 站点运营商/所有者。 | `墨梅团队` |
| `NUXT_PUBLIC_CONTACT_EMAIL` | 联系邮箱。 | `admin@example.com` |
| `NUXT_PUBLIC_DEFAULT_COPYRIGHT` | 默认版权声明类型。 | `all-rights-reserved`, `cc-by-nc-sa` |

### 3.2 备案与合规

| 变量名 | 说明 | 默认值 / 示例 |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_SHOW_COMPLIANCE_INFO` | 是否显示备案信息。 | `false` |
| `NUXT_PUBLIC_ICP_LICENSE_NUMBER` | ICP 备案号。 | `粤ICP备xxxxxxxx号` |
| `NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER` | 公安备案号。 | `粤公网安备 xxxxxxxxxxxxxx号` |
| `NUXT_PUBLIC_SECURITY_URL_WHITELIST` | 外部资源 URL 域名白名单（逗号分隔）。 | `images.unsplash.com,i.imgur.com` |

### 3.3 分析与监控

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_SENTRY_DSN` | Sentry DSN。 | `https://xxx@sentry.io/xxx` |
| `NUXT_PUBLIC_SENTRY_ENVIRONMENT` | Sentry 环境名称。 | `production`, `staging` |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | 百度统计 ID。 | `xxxxxxxx` |
| `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics ID。 | `G-xxxxxxxx` |
| `NUXT_PUBLIC_CLARITY_PROJECT_ID` | Microsoft Clarity 项目 ID。 | `xxxxxxxx` |

### 3.4 验证码 (Captcha)

墨梅支持多种验证码提供商，用于增强安全性（如登录、注册、评论）。

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER` | 验证码提供商。 | `cloudflare-turnstile`, `google-recaptcha`, `hcaptcha` |
| `NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY` | 验证码站点密钥 (公开)。 | `xxxx...` |
| `AUTH_CAPTCHA_SECRET_KEY` | 验证码秘密密钥 (私有)。 | `xxxx...` |

---

## 4. 数据库部署建议

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
            - ./logs:/app/logs
            - ./database:/app/database
            - ./uploads:/app/public/uploads # 持久化存储上传的文件
```

### 4.3 Cloudflare Pages / Workers 部署

墨梅支持部署到 Cloudflare 平台上。

1. **准备工作**: 确保你已安装 `Wrangler` 并完成登录。
2. **构建项目**:
   ```bash
   pnpm build
   ```
3. **部署**:
   ```bash
   pnpm wrangler deploy
   ```
4. **环境变量**: 在 Cloudflare 控制面板中配置 `AUTH_SECRET` 和 `DATABASE_URL` (推荐使用外部数据库如 Neon 或 TiDB Cloud)。

_注意_: Cloudflare 环境下不支持本地文件存储 (`STORAGE_TYPE=local`)，建议配合 Cloudflare R2 使用 (`STORAGE_TYPE=s3`)。

---

## 5. 管理员账号配置

为了方便初始部署，墨梅提供了两种管理员设置方式：

1.  **首位自动提权 (推荐)**: 系统在安装后，数据库用户表为空时，**第一个成功注册或登录**的账号将自动获得 `admin` 角色。
2.  **环境变量手动提权**: 后续若需添加其他管理员，可通过修改环境变量 `ADMIN_USER_IDS`，填入对应用户的唯一 ID，并以逗号分隔。
