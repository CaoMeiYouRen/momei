# 部署指南 (Deployment Guide)

墨梅 (Momei) 遵循 **约定优于配置 (Convention over Configuration)** 的原则。系统会自动检测环境变量，只需填入对应密钥，相关功能即可在后台自动激活，无需手动修改代码。

为了方便快速上手，我们将配置分为三个层级：**核心必填 (Level 1)**、**核心推荐 (Level 2)** 和 **体验增强 (Level 3)**。

---

## 1. 核心必填 (Level 1: Essential)
> **必须设置，缺失则系统无法正常运行或认证失败。**

- **`AUTH_SECRET`**: 认证加密密钥 (推荐 32 位)。用于保护用户 Session 和 Cookie 安全。
  - *生成方法*: `openssl rand -hex 32`。
- **`NUXT_PUBLIC_AUTH_BASE_URL`**: 认证回调基址。
  - *注意*: 必须包含协议 (http/https)，且必须与最终访问站点的地址完全一致（例如 `https://blog.example.com`）。

---

## 2. 核心推荐 (Level 2: Recommended)
> **这些配置虽然可选，但它们构成了墨梅作为 AI 博客的灵魂。**

### 2.1 数据库与性能 (Database)
- **`DATABASE_URL`**: 连接协议。墨梅支持 **智能推断**：
    - `sqlite://database/momei.sqlite` (默认值，适合小型站或演示)。
    - `mysql://user:pass@host:3306/db` (生产环境首选)。
    - `postgres://user:pass@host:5432/db` (适合高度扩展)。
- **`REDIS_URL`**: 开启后将显著提升页面加载速度及高并发下的限流性能。

### 2.2 AI 创作引擎 (AI Content)
- **`AI_API_KEY`**: 填入后点亮全站 AI 翻译、自动 SEO、摘要提取及标题建议。
- **`AI_PROVIDER`**: 可选 `openai`, `siliconflow`, `anthropic`, `deepseek` 等。
- **`AI_MODEL`**: 指定默认执行模型。

### 2.3 存储与媒体 (Storage)
- **`STORAGE_TYPE`**: 缺省为 `local` (存储在服务器硬盘)。建议设为 `s3` 以支持分布式部署。
- **`S3_ENDPOINT` / `BUCKET_NAME`**: 当使用 R2、AWS S3 或阿里云 OSS 时填写。

### 2.4 邮件与通知 (Email)
- **`EMAIL_USER` / `PASS`**: SMTP 认证信息。
- **`EMAIL_REQUIRE_VERIFICATION`**: 开启后，新用户注册必须验证邮箱，极大减少垃圾账户。

### 2.5 任务自动化 (Tasks)
- **`TASKS_TOKEN`**: 设置一个长随机字符串。用于通过 Webhook 触发定时发布文章、自动清理过期临时文件等系统维护任务。

---

## 3. 体验增强 (Level 3: Optional)
> **用于微调视觉表现、监控与站点合规。**

- **视觉特效**:
  - `LIVE2D_ENABLED`: 是否加载 3D 看板娘。
  - `CANVAS_NEST_ENABLED`: 是否启用首页背景粒子连线效果。
- **站点统计**:
  - `BAIDU_ANALYTICS_ID` / `GOOGLE_ANALYTICS_ID`: 接入主流统计平台。
  - `CLARITY_PROJECT_ID`: 录制用户点击行为，用于热力图分析。
- **故障监控**:
  - `SENTRY_DSN`: 在系统崩溃时第一时间接收邮件通知。
- **中国区合规**:
  - `SHOW_COMPLIANCE_INFO`: 快捷展示 ICP 备案号。
  - `ICP_LICENSE_NUMBER`: 备案号内容。

---

## 4. 各渠道配置示例 (Channel-Specific Guide)

### 4.1 硅基流动 (SiliconFlow) - **全栈多模态方案**
SiliconFlow 提供了极高性价比的 ASR/TTS 与 LLM 聚合方案。
```dotenv
AI_PROVIDER=siliconflow
AI_API_KEY=sk-xxxx
AI_API_ENDPOINT=https://api.siliconflow.cn/v1
# 一键复用 key 到语音识别与合成
ASR_PROVIDER=siliconflow
TTS_PROVIDER=siliconflow
```

### 4.2 火山引擎 (Volcengine / 豆包)
需要填写身份凭证与应用 ID。
```dotenv
VOLCENGINE_APP_ID=888888
VOLCENGINE_ACCESS_KEY=AK-xxx
VOLCENGINE_SECRET_KEY=SK-xxx
# 文本模型 AI_MODEL 需填写接入点 Endpoint ID
AI_MODEL=ep-2024xxx
```

### 4.3 生活流同步 (Memos)
将博客灵感与生活足迹实时推送到你的 Memos 实例。
```dotenv
MEMOS_ENABLED=true
MEMOS_INSTANCE_URL=https://memos.yourdomain.com
MEMOS_ACCESS_TOKEN=xxx
```

---

## 5. 部署到主流平台

- **Vercel**: 完美适配 Serverless 环境。推荐使用 `STORAGE_TYPE=vercel-blob`。可参考 [Vercel 部署演示](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)。
- **Docker**: 生产环境首选。建议映射两个 Volume：`./database` (存放 sqlite) 和 `./uploads` (存放上传文件)。
- **Cloudflare Pages**: 推荐搭配 R2 存储方案，实现全站静态加速与存储。

---

## 6. 排障指引 (Troubleshooting) 

- **认证失败**: 检查 `AUTH_BASE_URL` 的协议是否与你的 Nginx/Caddy 配置一致（必须匹配 https）。
- **AI 报错 500**: 检查 `AI_API_ENDPOINT` 是否需要特定的 `/v1` 后缀（查看厂商文档）。
- **静态资源 404**: 若使用 Docker 部署，请确认 `public/uploads` 目录具备读写权限。

---

## 7. 更多参考资源 (References)

- **[环境配置与系统设置映射 (Variables & Settings Mapping)](./variables)**: 详细列出了每一个变量的权限等级、脱敏类型及底层键名。
- **[完整环境变量示例文件 (.env.full.example)](../../.env.full.example)**: 查看项目支持的所有环境变量矩阵。
- **[系统集成设计文档](../design/modules/index)**: 深入了解各模块的技术选型与集成细节。

墨梅的部署原则是：**先配齐 Level 1 必修配置让系统跑起来，再根据需要逐步点亮 Level 2/3 的功能灯泡。**
