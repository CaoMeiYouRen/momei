# 环境配置与系统设置映射 (Variables & Settings Mapping)

本页详细列出了墨梅博客中所有的环境变量与其对应的系统内部设置键名（`SettingKey`）、权限等级及脱敏机制。

## 1. 核心概念说明

### 1.1 配置来源优先级
墨梅采用 **环境变量优先** 的策略：
1. **环境变量 (ENV)**: 最高优先级。如果配置了 ENV，数据库中的对应值将被忽略，且管理后台通常会显示为“只读”或“受限”状态。
2. **系统设置 (Database)**: 若未配置 ENV，系统会尝试从数据库 `setting` 表中读取。这部分内容可以通过管理后台的“系统设置”界面进行热修改。
3. **硬编码默认值**: 若以上两者均无，则回退到代码中的默认值。

### 1.2 配置等级 (Config Level)
用于控制该配置项在 API 响应中的可见性：
- **Level 0 (公开)**: 任何人可见（如站点名称、Logo）。
- **Level 1 (受限)**: 仅登录用户可见。
- **Level 2 (管理)**: 仅管理员可见（支持脱敏显示）。
- **Level 3 (内核)**: 仅服务端可见，永远不会通过 API 返回给前端（如 `AUTH_SECRET`）。

### 1.3 脱敏类型 (Mask Type)
- **none**: 原样显示。
- **password**: 全部遮蔽 (********)。
- **key**: 保留前 4 位和后 4 位，中间遮蔽 (sk-a...bc12)。
- **email**: 邮箱脱敏 (a***@example.com)。

---

## 2. 完整映射表 (Mapping Table)

### 2.1 基础核心 (Essential)
这些变量通常由系统初始化时锁定，建议仅通过环境变量配置。

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `NUXT_PUBLIC_APP_NAME` | `site_name` / `site_title` | 0 | none | 站点名称，同时影响标题与部分公开文案 |
| `NUXT_PUBLIC_SITE_URL` | - | 0 | none | 运行时公开站点 URL，用于 SEO、Sitemap、RSS 和公开链接生成 |
| `AUTH_SECRET` | - | 3 | password | **核心密钥**，不进入数据库，仅限 ENV |
| `NUXT_PUBLIC_AUTH_BASE_URL` | `site_url` | 0 | none | Better Auth 回调地址，系统设置锁定态主要基于此变量 |
| `NUXT_PUBLIC_DEFAULT_COPYRIGHT` | `site_copyright` | 0 | none | 默认版权声明类型 |
| `NUXT_PUBLIC_CONTACT_EMAIL` | `contact_email` | 0 | email | 站点公开联系邮箱 |
| `MACHINE_ID` | - | 3 | none | 分布式 ID 机器码 (0-1023) |

### 2.2 AI 引擎 (AI Integration)
控制全站 AI 赋能的核心开关。

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `AI_ENABLED` | `ai_enabled` | 0 | none | 是否启用全站 AI 功能 |
| `AI_PROVIDER` | `ai_provider` | 2 | none | 文本 AI 提供商 (openai/siliconflow 等) |
| `AI_API_KEY` | `ai_api_key` | 2 | key | AI 服务商生成的 API 密钥 |
| `AI_MODEL` | `ai_model` | 2 | none | 默认执行模型名称 |
| `AI_API_ENDPOINT` | `ai_endpoint` | 2 | none | API 代理/转发地址 |
| `AI_HEAVY_TASK_TIMEOUT` | - | 3 | none | TTS / ASR / 图片生成等重任务的统一超时窗口 |
| `AI_TEXT_DIRECT_RETURN_MAX_CHARS` | - | 3 | none | 文本翻译在同步直返和异步任务之间切换的字符阈值 |
| `AI_TEXT_TASK_CHUNK_SIZE` | - | 3 | none | 长文本翻译任务的默认分块大小 |
| `AI_TEXT_TASK_CONCURRENCY` | - | 3 | none | 长文本翻译任务的默认并发度 |
| `GEMINI_API_TOKEN` | `gemini_api_token` | 2 | key | Gemini 独立 Token 鉴权 |
| `AI_IMAGE_ENABLED` | `ai_image_enabled` | 0 | none | 是否启用 AI 图像能力 |
| `AI_IMAGE_PROVIDER` | `ai_image_provider` | 2 | none | AI 图像提供商 |
| `AI_IMAGE_API_KEY` | `ai_image_api_key` | 2 | key | AI 图像 API Key |
| `AI_IMAGE_MODEL` | `ai_image_model` | 2 | none | AI 图像模型 |
| `AI_IMAGE_ENDPOINT` | `ai_image_endpoint` | 2 | none | AI 图像兼容接口或代理端点 |
| `AI_QUOTA_ENABLED` | `ai_quota_enabled` | 2 | none | 是否启用 AI 分级额度治理 |
| `AI_QUOTA_POLICIES` | `ai_quota_policies` | 2 | none | AI 配额策略 JSON，支持 global / role / trust_level / user 多层覆盖 |
| `AI_ALERT_THRESHOLDS` | `ai_alert_thresholds` | 2 | none | AI 告警阈值 JSON，覆盖额度、成本与失败突增告警 |
| `ASR_ENABLED` | `asr_enabled` | 0 | none | 语音转文字 (ASR) 开关 |
| `ASR_PROVIDER` | `asr_provider` | 2 | none | ASR 提供商 |
| `ASR_API_KEY` | `asr_api_key` | 2 | key | ASR 通用 API Key |
| `ASR_MODEL` | `asr_model` | 2 | none | ASR 默认模型或资源 ID |
| `ASR_ENDPOINT` | `asr_endpoint` | 2 | none | ASR 兼容接口或直连端点 |
| `ASR_SILICONFLOW_API_KEY` | `asr_siliconflow_api_key` | 2 | key | SiliconFlow ASR 专用 Key |
| `ASR_SILICONFLOW_MODEL` | `asr_siliconflow_model` | 2 | none | SiliconFlow ASR 专用模型 |
| `ASR_VOLCENGINE_APP_ID` | `asr_volcengine_app_id` | 2 | none | Volcengine ASR 专用 App ID |
| `ASR_VOLCENGINE_ACCESS_KEY` | `asr_volcengine_access_key` | 2 | key | Volcengine ASR 专用 Access Key |
| `ASR_VOLCENGINE_SECRET_KEY` | `asr_volcengine_secret_key` | 2 | password | Volcengine ASR 专用 Secret Key |
| `ASR_VOLCENGINE_CLUSTER_ID` | `asr_volcengine_cluster_id` | 2 | none | Volcengine ASR 专用资源 ID |
| `TTS_ENABLED` | `tts_enabled` | 0 | none | 文字转语音 (TTS) 开关 |
| `TTS_PROVIDER` | `tts_provider` | 2 | none | TTS 提供商 |
| `TTS_API_KEY` | `tts_api_key` | 2 | key | TTS API Key，默认可回退复用 `AI_API_KEY` |
| `TTS_ENDPOINT` | `tts_endpoint` | 2 | none | TTS 兼容接口或代理端点 |
| `TTS_DEFAULT_MODEL` | `tts_model` | 2 | none | 默认 TTS 模型 |
| `TTS_DEFAULT_VOICE` | - | 2 | none | 默认 TTS 音色 |

### 2.3 数据库与存储 (Storage & DB)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | - | 3 | password | 数据库连接串，不进入数据库 |
| `REDIS_URL` | - | 3 | password | 缓存/限流连接串 |
| `STORAGE_TYPE` | `storage_type` | 2 | none | 存储引擎，规范值为 `local` / `s3` / `r2` / `vercel_blob`，兼容旧值 `vercel-blob` |
| `LOCAL_STORAGE_DIR` | `local_storage_dir` | 2 | none | 本地存储目录 |
| `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` | `local_storage_base_url` | 2 | none | 本地静态资源公开前缀 |
| `LOCAL_STORAGE_MIN_FREE_SPACE` | `local_storage_min_free_space` | 2 | none | 本地磁盘剩余空间保护阈值 |
| `S3_ENDPOINT` | `s3_endpoint` | 2 | none | S3 兼容存储 endpoint |
| `S3_BUCKET_NAME` | `s3_bucket` | 2 | none | S3 兼容存储桶名称 |
| `S3_REGION` | `s3_region` | 2 | none | S3 区域 |
| `S3_ACCESS_KEY_ID` | `s3_access_key` | 2 | key | S3 兼容存储的归档 Key |
| `S3_SECRET_ACCESS_KEY` | `s3_secret_key` | 2 | password | S3 兼容存储的机密密钥 |
| `S3_BASE_URL` | `s3_base_url` | 2 | none | S3 兼容存储的公共访问域名 |
| `BUCKET_PREFIX` | `s3_bucket_prefix` | 2 | none | 兼容旧配置的对象前缀 |
| `ASSET_PUBLIC_BASE_URL` | `asset_public_base_url` | 2 | none | 静态资源统一公共访问前缀，优先级高于驱动 base_url |
| `ASSET_OBJECT_PREFIX` | `asset_object_prefix` | 2 | none | 静态资源统一对象前缀，优先级高于 `s3_bucket_prefix` |
| `CLOUDFLARE_R2_ACCOUNT_ID` | `cloudflare_r2_account_id` | 2 | none | Cloudflare R2 账户 ID |
| `CLOUDFLARE_R2_ACCESS_KEY` | `cloudflare_r2_access_key` | 2 | key | Cloudflare R2 Access Key |
| `CLOUDFLARE_R2_SECRET_KEY` | `cloudflare_r2_secret_key` | 2 | password | Cloudflare R2 Secret Key |
| `CLOUDFLARE_R2_BUCKET` | `cloudflare_r2_bucket` | 2 | none | Cloudflare R2 存储桶 |
| `CLOUDFLARE_R2_BASE_URL` | `cloudflare_r2_base_url` | 2 | none | Cloudflare R2 公共访问域名 |
| `BLOB_READ_WRITE_TOKEN`| `vercel_blob_token` | 3 | password | Vercel Blob 专有令牌 |

说明：浏览器直传目前在 `STORAGE_TYPE=s3` 或 `STORAGE_TYPE=r2` 时优先走预签名 `PUT` 上传；其他驱动仍回退到服务端代理上传。

### 2.4 认证与系统安全 (Security)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `ALLOW_REGISTRATION` | `allow_registration` | 0 | none | 是否开放新用户注册 |
| `ANONYMOUS_LOGIN_ENABLED`| `anonymous_login_enabled`| 0 | none | 是否开启免密匿名访问 |
| `ENABLE_CAPTCHA` | `enable_captcha` | 0 | none | 是否启用验证码 |
| `NUXT_PUBLIC_GITHUB_CLIENT_ID`| `github_client_id` | 2 | none | GitHub OAuth ID |
| `GITHUB_CLIENT_SECRET` | `github_client_secret` | 3 | password | GitHub OAuth Secret (系统锁定) |
| `NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER` | `captcha_provider` | 2 | none | 验证码提供商 |
| `NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY` | `captcha_site_key` | 2 | none | 验证码站点公钥 |
| `AUTH_CAPTCHA_SECRET_KEY` | `captcha_secret_key` | 3 | password | 验证码密钥 (系统锁定) |

### 2.5 运维与视觉服务 (Operations)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `TASKS_TOKEN` | - | 3 | password | Webhook 任务鉴权令牌 |
| `WEBHOOK_SECRET` | - | 3 | password | Webhook HMAC 验签密钥 |
| `TASK_CRON_EXPRESSION` | - | 3 | none | 自部署环境内置 Cron 表达式，默认每 5 分钟执行一次 |
| `DISABLE_CRON_JOB` | - | 3 | none | 显式禁用自部署环境内置 Cron |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID`| `baidu_analytics` | 0 | none | 百度统计 ID |
| `NUXT_PUBLIC_SENTRY_DSN` | - | 0 | key | Sentry 前后端共享监控 DSN |
| `LOG_LEVEL` | - | 3 | none | 日志等级 (debug/info/error) |
| `NUXT_PUBLIC_LIVE2D_ENABLED`| `live2d_enabled` | 0 | none | 看板娘系统开关 |

### 2.6 第三方与内容分发 (Third-party & Distribution)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `MEMOS_ENABLED` | `memos_enabled` | 2 | none | 是否启用 Memos 发布同步 |
| `MEMOS_INSTANCE_URL` | `memos_instance_url` | 2 | none | Memos 实例地址 |
| `MEMOS_ACCESS_TOKEN` | `memos_access_token` | 2 | key | Memos API Token |
| `MEMOS_DEFAULT_VISIBILITY` | `memos_default_visibility` | 2 | none | Memos 默认可见性 |

---

## 3. 锁定机制与注意事项

1. **环境变量锁定 (FORCED_ENV_LOCKED)**: 
   由于部分第三方库 (如 Better-Auth) 会避开系统设置直接读取 `process.env`，因此针对 `SITE_URL`、`GITHUB_*`、`GOOGLE_*` 以及 `CAPTCHA_*` 等配置，系统强制执行环境变量锁定策略，无法在管理后台进行修改。

2. **内部独占 (INTERNAL_ONLY)**:
   `DATABASE_URL`、`REDIS_URL` 和 `AUTH_SECRET` 是系统的命脉，它们永远不会出现在数据库中，也不会在后台设置界面显示，必须通过宿主机环境变量传入。

3. **热更新响应**:
   非锁定类的配置在后台修改后通常会立即生效（部分存储引擎切换可能需要重启服务以重置驱动）。

4. **调度相关补充**:
   `WEBHOOK_TIMESTAMP_TOLERANCE` 这个变量名目前仍保留在示例文件中，但当前实现尚未真正读取；Webhook 时间戳容差默认固定为 5 分钟。
