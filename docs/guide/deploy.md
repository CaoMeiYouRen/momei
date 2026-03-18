# 部署指南 (Deployment Guide)

墨梅 (Momei) 的部署配置以环境变量为主，并与当前代码实现保持同步。大多数功能遵循“填入对应变量即可启用”的原则，但认证、定时任务与对象存储这几类能力仍然建议优先通过环境变量管理，而不是依赖后台动态修改。

为了方便落地，本指南把配置分为三层：**核心必填**、**生产推荐** 和 **体验增强**。

---

## 1. 核心必填 (Level 1: Essential)

> 缺失这些配置时，系统要么无法启动，要么会在认证、公开链接生成或数据库初始化阶段出现明显错误。

- **`AUTH_SECRET`**: Better Auth 与服务端签名的核心密钥。
  - 生成方式：`openssl rand -hex 32`
- **`NUXT_PUBLIC_SITE_URL`**: 站点公开访问地址，用于 SEO、Sitemap、RSS、联邦协议和公开链接生成。
- **`NUXT_PUBLIC_AUTH_BASE_URL`**: Better Auth 回调基址。
  - 生产环境中通常应与 `NUXT_PUBLIC_SITE_URL` 保持一致。
- **`DATABASE_URL`**: 数据库连接串。
  - SQLite：`sqlite://database/momei.sqlite`
  - MySQL：`mysql://user:pass@host:3306/db`
  - PostgreSQL：`postgres://user:pass@host:5432/db`

## 2. 生产推荐 (Level 2: Recommended)

> 这些配置不是“启动必需”，但基本决定了线上部署是否稳定、好用、可维护。

### 2.1 数据库与缓存

- **`DATABASE_SYNCHRONIZE=false`**: 生产环境建议固定为 `false`。
- **`REDIS_URL`**: 启用缓存、部分限流与分布式能力时推荐配置。

### 2.2 AI 与多模态能力

- **`AI_PROVIDER`** / **`AI_API_KEY`** / **`AI_MODEL`**: 文本 AI 主引擎。
- **`AI_API_ENDPOINT`**: OpenAI 兼容服务或代理端点。
- **`AI_HEAVY_TASK_TIMEOUT`**: 统一控制 TTS / ASR / AI 图片等重任务超时窗口。
- **`AI_TEXT_DIRECT_RETURN_MAX_CHARS`** / **`AI_TEXT_TASK_CHUNK_SIZE`** / **`AI_TEXT_TASK_CONCURRENCY`**: 控制翻译与长文本处理的直返阈值、分块大小和并发度。
- **`GEMINI_API_TOKEN`**: 当 Gemini 需要独立 Token 鉴权时使用。
- **`AI_IMAGE_ENABLED`** / **`AI_IMAGE_PROVIDER`** / **`AI_IMAGE_API_KEY`**: AI 绘图链路。
- **`ASR_ENABLED`** / **`ASR_PROVIDER`** / **`ASR_API_KEY`** / **`ASR_MODEL`** / **`ASR_ENDPOINT`**: 语音识别基础配置。
- **`TTS_ENABLED`** / **`TTS_PROVIDER`** / **`TTS_API_KEY`** / **`TTS_DEFAULT_MODEL`**: 文本转语音基础配置。
- **`AI_QUOTA_ENABLED`** / **`AI_QUOTA_POLICIES`** / **`AI_ALERT_THRESHOLDS`**: 启用 AI 分级额度与阈值告警；建议直接复用后台设置页导出的 JSON 结构。

### 2.3 存储与媒体

- **`STORAGE_TYPE`**: 推荐使用 `local`、`s3`、`r2` 或 `vercel_blob`。
  - 兼容说明：历史值 `vercel-blob` 仍可读取，但新配置统一使用 `vercel_blob`。
- **本地存储**: `LOCAL_STORAGE_DIR` + `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` + `LOCAL_STORAGE_MIN_FREE_SPACE`
- **S3 兼容存储**: `S3_ENDPOINT`、`S3_BUCKET_NAME`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`S3_BASE_URL`
- **Cloudflare R2**: `CLOUDFLARE_R2_ACCOUNT_ID`、`CLOUDFLARE_R2_ACCESS_KEY`、`CLOUDFLARE_R2_SECRET_KEY`、`CLOUDFLARE_R2_BUCKET`、`CLOUDFLARE_R2_BASE_URL`
- **路径前缀治理**:
  - `ASSET_PUBLIC_BASE_URL`: 统一 CDN/公共访问域名。
  - `ASSET_OBJECT_PREFIX`: 统一对象存储路径前缀。
  - `BUCKET_PREFIX`: 兼容旧版 S3 前缀配置。
- **Vercel Blob**: `BLOB_READ_WRITE_TOKEN`

说明：浏览器直传目前在 `STORAGE_TYPE=s3` 或 `STORAGE_TYPE=r2` 时优先走 `PUT` 预签名授权；`local` 和 `vercel_blob` 继续回退到服务端代理上传。

### 2.4 邮件与通知

- **`EMAIL_HOST`** / **`EMAIL_PORT`** / **`EMAIL_USER`** / **`EMAIL_PASS`** / **`EMAIL_FROM`**
- **`EMAIL_REQUIRE_VERIFICATION`**: 生产环境推荐开启，减少垃圾注册。

### 2.5 定时任务与自动化

- **`CRON_SECRET`**: Vercel Cron 专用 Bearer 鉴权密钥，平台会自动以 `Authorization: Bearer <secret>` 调用任务端点。
- **`TASKS_TOKEN`**: 定时任务 Webhook 的基础鉴权令牌，主要用于手动触发或兼容旧集成。
- **`WEBHOOK_SECRET`**: 推荐单独配置，用于 HMAC 模式验签。
- **`TASK_CRON_EXPRESSION`**: 仅自部署环境有效，用于覆盖内置 Cron 频率。
- **`DISABLE_CRON_JOB=true`**: 用于显式关闭自部署环境内置 Cron。
- **`FRIEND_LINKS_CHECK_INTERVAL_MINUTES`**: 友链巡检的最小生效间隔。后台可调整，但最终不会低于 60 分钟。
- **`FRIEND_LINKS_CHECK_BATCH_SIZE`**: 单轮友链巡检批量，默认 `20`。
- **`FRIEND_LINKS_CHECK_TIMEOUT_MS`**: 单站点探测超时，默认 `8000` 毫秒。
- **`FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES`**: 连续失败站点的最大冷却窗口，默认 `10080` 分钟（7 天）。
- **`FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD`**: 连续失败达到阈值后自动转为 `inactive`，默认关闭。

说明：`WEBHOOK_TIMESTAMP_TOLERANCE` 这个变量名当前仍保留在示例文件中，但现版本实现尚未读取它；Webhook 校验默认固定为 5 分钟容差。

友链巡检说明：即使 Cloudflare / Vercel 的统一定时入口触发更频繁，友链服务也只会对已达到最小间隔且不处于失败冷却期的记录发起探测。

## 3. 体验增强 (Level 3: Optional)

> 用于补齐监控、站点品牌、视觉效果与商业化默认配置。

- **站点元数据**:
  - `NUXT_PUBLIC_APP_NAME`
  - `NUXT_PUBLIC_SITE_DESCRIPTION`
  - `NUXT_PUBLIC_SITE_KEYWORDS`
  - `NUXT_PUBLIC_CONTACT_EMAIL`
  - `NUXT_PUBLIC_POST_COPYRIGHT`
  - `NUXT_PUBLIC_SITE_COPYRIGHT_OWNER`
  - `NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR`
- **统计与监控**:
  - `NUXT_PUBLIC_BAIDU_ANALYTICS_ID`
  - `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
  - `NUXT_PUBLIC_CLARITY_PROJECT_ID`
  - `NUXT_PUBLIC_SENTRY_DSN`
- **视觉特效**:
  - `NUXT_PUBLIC_LIVE2D_ENABLED`
  - `NUXT_PUBLIC_CANVAS_NEST_ENABLED`
  - `NUXT_PUBLIC_EFFECTS_MOBILE_ENABLED`
- **中国区合规**:
  - `NUXT_PUBLIC_SHOW_COMPLIANCE_INFO`
  - `NUXT_PUBLIC_ICP_LICENSE_NUMBER`
  - `NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER`
- **商业化默认配置**:
  - `COMMERCIAL_SPONSORSHIP_JSON`

## 4. 各渠道配置示例 (Channel-Specific Guide)

### 4.1 SiliconFlow: 文本 + ASR/TTS 一体化

```dotenv
AI_PROVIDER=siliconflow
AI_API_KEY=sk-xxxx
AI_MODEL=Qwen/Qwen2.5-72B-Instruct
AI_API_ENDPOINT=https://api.siliconflow.cn/v1

ASR_ENABLED=true
ASR_PROVIDER=siliconflow
ASR_SILICONFLOW_API_KEY=sk-xxxx
ASR_SILICONFLOW_MODEL=FunAudioLLM/SenseVoiceSmall

TTS_ENABLED=true
TTS_PROVIDER=siliconflow
TTS_API_KEY=sk-xxxx
```

### 4.2 Volcengine / 豆包: 文本或 ASR 分离接入

如果你只接入火山 ASR，建议优先填写 ASR 专用凭据：

```dotenv
ASR_ENABLED=true
ASR_PROVIDER=volcengine
ASR_VOLCENGINE_APP_ID=888888
ASR_VOLCENGINE_ACCESS_KEY=AK-xxx
ASR_VOLCENGINE_SECRET_KEY=SK-xxx
ASR_VOLCENGINE_CLUSTER_ID=volc.bigasr.sauc.duration
```

如果文本 AI 也走火山体系，再补充：

```dotenv
AI_PROVIDER=volcengine
AI_API_KEY=your-text-api-key
AI_MODEL=ep-2024xxx
```

### 4.3 Memos 同步

```dotenv
MEMOS_ENABLED=true
MEMOS_INSTANCE_URL=https://memos.yourdomain.com
MEMOS_ACCESS_TOKEN=xxx
MEMOS_DEFAULT_VISIBILITY=PRIVATE
```

## 5. 部署到主流平台

- **Vercel**: 适合 Serverless 部署。
  - 推荐 `STORAGE_TYPE=vercel_blob` 或外接 S3/R2。
  - 应配置 `CRON_SECRET` 供平台自动注入 Bearer 头；如需兼容手动调用，再额外配置 `TASKS_TOKEN` 或 `WEBHOOK_SECRET`。
  - 内置 Cron 由 [vercel.json](../../vercel.json) 触发，默认每天一次。
- **Docker / 自部署服务器**: 适合需要本地磁盘、定时任务和更强可控性的场景。
  - 建议挂载 `database/` 与上传目录。
  - 如需内置 Cron，可使用 `TASK_CRON_EXPRESSION` 自定义频率。
- **Cloudflare（外围能力接入）**:
  - 当前版本暂不支持将应用主体完整部署到 Cloudflare Pages / Workers，根因是项目仍依赖 TypeORM 与 Node 运行时能力。
  - Cloudflare R2 可继续作为对象存储接入。
  - Scheduled Events 相关触发适配与 [wrangler.toml](../../wrangler.toml) 配置当前保留为外围能力设计 / 实验入口，不应解读为整站 Cloudflare 运行时已受支持。
  - `pnpm deploy:wrangler` 当前仅用于 wrangler 侧适配调试，不应作为生产环境整站部署命令。

## 6. 排障指引 (Troubleshooting)

- **认证回调错误**: 检查 `NUXT_PUBLIC_SITE_URL` 与 `NUXT_PUBLIC_AUTH_BASE_URL` 是否都使用最终公开域名，且协议一致。
- **定时任务返回 401**: 检查触发方式是否和当前配置一致。
  - Vercel Cron 模式：`CRON_SECRET`
  - Token 模式：`TASKS_TOKEN`
  - HMAC 模式：`WEBHOOK_SECRET`
- **Volcengine ASR 未生效**: 优先检查 `ASR_VOLCENGINE_APP_ID` / `ASR_VOLCENGINE_ACCESS_KEY` / `ASR_VOLCENGINE_CLUSTER_ID`，其次再检查通用 `VOLCENGINE_*` 回退配置。
- **AI 兼容接口报错**: 检查 `AI_API_ENDPOINT` 是否需要带 `/v1` 后缀。
- **直传仍走代理上传**: 检查 `STORAGE_TYPE` 是否为 `s3` 或 `r2`，并确认对象存储凭据、Bucket 与公开地址已配置完整。
- **本地上传资源 404**: 检查 `LOCAL_STORAGE_DIR` 是否存在，以及 `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` 是否与实际静态路径匹配。
- **Cloudflare Pages / Workers 运行时报 TypeORM / Node 兼容错误**: 这是当前已知边界，不是部署步骤遗漏。请改用 Vercel、Docker 或自托管 Node 环境作为应用主体；如需 Cloudflare，当前仅保留 R2 / Scheduled Events 等外围能力接入。

## 7. 更多参考资源 (References)

- **[环境配置与系统设置映射 (Variables & Settings Mapping)](./variables)**: 查看变量和设置中心键名的大致对应关系。
- **[完整环境变量示例文件 (.env.full.example)](../../.env.full.example)**: 查看当前版本支持的完整环境变量矩阵。
- **[系统集成设计文档](../design/modules/index)**: 了解各功能模块的技术边界与集成方式。

墨梅的部署原则仍然不变：**先把核心变量配齐让系统稳定跑起来，再按模块逐步点亮 AI、存储、任务和商业化能力。**
