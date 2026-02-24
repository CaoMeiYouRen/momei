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
| `NUXT_PUBLIC_APP_NAME` | `site_name` | 0 | none | 站点名称，显示在标题栏与页脚 |
| `NUXT_PUBLIC_SITE_URL` | `site_url` | 0 | none | 站点基础 URL，影响 SEO 与 RSS |
| `AUTH_SECRET` | - | 3 | password | **核心密钥**，不进入数据库，仅限 ENV |
| `NUXT_PUBLIC_AUTH_BASE_URL` | `site_url` | 0 | none | 认证回调地址，建议与 SITE_URL 一致 |
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
| `ASR_ENABLED` | `asr_enabled` | 0 | none | 语音转文字 (ASR) 开关 |
| `TTS_ENABLED` | `tts_enabled` | 0 | none | 文字转语音 (TTS) 开关 |

### 2.3 数据库与存储 (Storage & DB)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | - | 3 | password | 数据库连接串，不进入数据库 |
| `REDIS_URL` | - | 3 | password | 缓存/限流连接串 |
| `STORAGE_TYPE` | `storage_type` | 2 | none | 存储引擎 (local/s3/vercel-blob) |
| `S3_ACCESS_KEY_ID` | `s3_access_key` | 2 | key | S3 兼容存储的归档 Key |
| `S3_SECRET_ACCESS_KEY` | `s3_secret_key` | 2 | password | S3 兼容存储的机密密钥 |
| `BLOB_READ_WRITE_TOKEN`| `vercel_blob_token` | 3 | password | Vercel Blob 专有令牌 |

### 2.4 认证与系统安全 (Security)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `ALLOW_REGISTRATION` | `allow_registration` | 0 | none | 是否开放新用户注册 |
| `ANONYMOUS_LOGIN_ENABLED`| `anonymous_login_enabled`| 0 | none | 是否开启免密匿名访问 |
| `NUXT_PUBLIC_GITHUB_CLIENT_ID`| `github_client_id` | 2 | none | GitHub OAuth ID |
| `GITHUB_CLIENT_SECRET` | `github_client_secret` | 3 | password | GitHub OAuth Secret (系统锁定) |
| `AUTH_CAPTCHA_SECRET_KEY` | `captcha_secret_key` | 3 | password | 验证码密钥 (系统锁定) |

### 2.5 运维与视觉服务 (Operations)

| 环境变量 | 系统设置键名 (SettingKey) | 等级 | 脱敏 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `TASKS_TOKEN` | - | 3 | password | Webhook 任务鉴权令牌 |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID`| `baidu_analytics` | 0 | none | 百度统计 ID |
| `NUXT_PUBLIC_SENTRY_DSN` | - | 3 | key | Sentry 监控 DSN |
| `LOG_LEVEL` | - | 3 | none | 日志等级 (debug/info/error) |
| `NUXT_PUBLIC_LIVE2D_ENABLED`| `live2d_enabled` | 0 | none | 看板娘系统开关 |

---

## 3. 锁定机制与注意事项

1. **环境变量锁定 (FORCED_ENV_LOCKED)**: 
   由于部分第三方库 (如 Better-Auth) 会避开系统设置直接读取 `process.env`，因此针对 `SITE_URL`、`GITHUB_*`、`GOOGLE_*` 以及 `CAPTCHA_*` 等配置，系统强制执行环境变量锁定策略，无法在管理后台进行修改。

2. **内部独占 (INTERNAL_ONLY)**:
   `DATABASE_URL`、`REDIS_URL` 和 `AUTH_SECRET` 是系统的命脉，它们永远不会出现在数据库中，也不会在后台设置界面显示，必须通过宿主机环境变量传入。

3. **热更新响应**:
   非锁定类的配置在后台修改后通常会立即生效（部分存储引擎切换可能需要重启服务以重置驱动）。
