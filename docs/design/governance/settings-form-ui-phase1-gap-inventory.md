# 设置表单 UI Phase 1 — 盘点与 SoT 映射补齐报告

> 本文档记录 Phase 1 的盘点结论、缺口分类与补齐变更。
> 时间：2026-07-27 | 阶段：[第六十三阶段](../../plan/todo.md#1-设置表单-ui-phase-1--盘点与-sot-映射补齐-p2)

---

## 一、盘点范围说明

- **SoT 系统**：`SettingKey` 枚举（`types/setting.ts`）+ `SETTING_ENV_MAP`（`server/services/setting.constants.ts`）
- **Env 事实源**：`utils/shared/env.ts`（运行时直接读取的环境变量）
- **文档参考**：`.env.full.example`（完整环境变量文档）
- **UI 覆盖**：`pages/admin/settings/index.vue` + `components/admin/settings/*.vue`
- **不涉及**：UI 组件开发、`FORCED_ENV_LOCKED_KEYS` 变更、Theme 设置页

---

## 二、缺口分类方法

| 类别 | 定义 | 处理策略 |
|:---|:---|:---|
| **Gap A** | Env-only：在 `env.ts` 中直读，但无 `SettingKey` / `SETTING_ENV_MAP` 映射 | 新增 `SettingKey` + `SETTING_ENV_MAP` 映射 + 默认值同步 |
| **Gap B** | Setting-only：已有 `SettingKey` 但缺 `SETTING_ENV_MAP` 映射 | 补充 `SETTING_ENV_MAP` 条目 |
| **Internal** | 基础设施/安全密钥，不适合后台管理 | 标记 `INTERNAL_ONLY` + `env.ts` 注释 + 封锁写入 |

---

## 三、缺口清单

### 3.1 Gap A — Env-only 适合补齐的 (共 5 项，本阶段补齐)

| # | Env Var | 所在文件 | 类型 | 分类理由 | 目标 SettingKey |
|:---|:---|:---|:---|:---|:---|
| 1 | `EMAIL_SECURE` | `env.ts:166` | `boolean` | SMTP SSL/TLS 控制，与 EMAIL_HOST/PORT/USER/PASS 同组 | `EMAIL_SECURE` |
| 2 | `EMAIL_EXPIRES_IN` | `env.ts:184` | `number` | 验证码 TTL，安全与 UX 相关 | `EMAIL_EXPIRES_IN` |
| 3 | `TEMP_EMAIL_DOMAIN_NAME` | `env.ts:187` | `string` | 临时邮箱拦截，防止滥用 | `TEMP_EMAIL_DOMAIN_NAME` |
| 4 | `TTS_DEFAULT_VOICE` | `env.ts:348` | `string` | TTS 默认音色，TTS 配置同组 | `TTS_DEFAULT_VOICE` |
| 5 | `AI_MAX_TOKENS` | `env.ts:289` | `number` | AI 生成 Token 上限，权限控制相关 | `AI_MAX_TOKENS` |

### 3.2 Gap B — 已有 SettingKey 缺 SETTING_ENV_MAP 的 (9 项，延期至后续阶段)

| # | SettingKey | DB Key | 说明 | 优先级 |
|:---|:---|:---|:---|:---|
| 1 | `AI_FALLBACK_PROVIDER` | `ai_fallback_provider` | Phase 55 新增，缺 env 覆盖 | P2 |
| 2 | `AI_FALLBACK_API_KEY` | `ai_fallback_api_key` | Phase 55 新增，缺 env 覆盖 | P2 |
| 3 | `AI_FALLBACK_MODEL` | `ai_fallback_model` | Phase 55 新增，缺 env 覆盖 | P2 |
| 4 | `AI_FALLBACK_ENDPOINT` | `ai_fallback_endpoint` | Phase 55 新增，缺 env 覆盖 | P2 |
| 5 | `AI_IMAGE_FALLBACK_PROVIDER` | `ai_image_fallback_provider` | AI Image fallback，缺 env 覆盖 | P2 |
| 6 | `AI_IMAGE_FALLBACK_API_KEY` | `ai_image_fallback_api_key` | AI Image fallback，缺 env 覆盖 | P2 |
| 7 | `AI_IMAGE_FALLBACK_MODEL` | `ai_image_fallback_model` | AI Image fallback，缺 env 覆盖 | P2 |
| 8 | `AI_IMAGE_FALLBACK_ENDPOINT` | `ai_image_fallback_endpoint` | AI Image fallback，缺 env 覆盖 | P2 |
| 9 | `TTS_CREDENTIAL_TTL_SECONDS` | `tts_credential_ttl_seconds` | ASR 版已映射，TTS 版未映射 | P2 |

> **P2延期理由**：以上 SettingKey 均为 Phase 55-62 新增的 fallback/辅助功能键，
> 核心功能（AI Image、AI Fallback 等）为 P2 优先级；TTS_CREDENTIAL_TTL_SECONDS 与 ASR 复用同一逻辑路径，影响有限。

### 3.3 缺 SettingKey/Env 映射但适合保持 Internal 的

| # | Env Var | 类别 | INTERNAL 理由 |
|:---|:---|:---|:---|
| 1 | `CRON_SECRET` | 运维 | 定时任务鉴权密钥，不与后台设置同存 |
| 2 | `TASKS_TOKEN` | 运维 | 任务调度鉴权，同 CRON_SECRET |
| 3 | `WEBHOOK_SECRET` | 运维 | Webhook HMAC 签名密钥 |
| 4 | `MOMEI_ENABLE_MCP_HTTP` | 基础设施 | MCP HTTP 挂载开关，后台不暴露 |
| 5 | `MOMEI_INSTALLED` | 基础设施 | 安装锁定标志，安装完成后不再修改 |

### 3.4 已有完整覆盖的 Gap 零报告

以下模块的 SettingKey 已经完整映射到 SETTING_ENV_MAP，UI 覆盖良好：

- **Analytics**：BAIDU / GOOGLE / CLARITY / UMAMI — 全部 4 项 ✓
- **Auth/Social**：GITHUB / GOOGLE OAuth + ANONYMOUS_LOGIN + ALLOW_REGISTRATION ✓
- **Security/Captcha**：CAPTCHA_PROVIDER / SITE_KEY / SECRET_KEY + ENABLE_CAPTCHA ✓
- **Storage**：全部 LOCAL / S3 / R2 / Vercel Blob 字段 ✓
- **Theme**：全部 13 项 ✓
- **Web Push**：全部 3 项 ✓
- **Limits**：全部 8 项 ✓
- **External Feeds**：全部 6 项 ✓

---

## 四、本阶段变更清单

### 4.1 `types/setting.ts` — 新增 5 个 SettingKey

在对应分类下新增：

```typescript
// Email (新增)
EMAIL_SECURE = 'email_secure',
EMAIL_EXPIRES_IN = 'email_expires_in',
TEMP_EMAIL_DOMAIN_NAME = 'temp_email_domain_name',

// AI (新增)
AI_MAX_TOKENS = 'ai_max_tokens',

// TTS (新增)
TTS_DEFAULT_VOICE = 'tts_default_voice',
```

### 4.2 `server/services/setting.constants.ts` — SETTING_ENV_MAP 新增 5 条

```typescript
[SettingKey.EMAIL_SECURE]: 'EMAIL_SECURE',
[SettingKey.EMAIL_EXPIRES_IN]: 'EMAIL_EXPIRES_IN',
[SettingKey.TEMP_EMAIL_DOMAIN_NAME]: 'TEMP_EMAIL_DOMAIN_NAME',
[SettingKey.TTS_DEFAULT_VOICE]: 'TTS_DEFAULT_VOICE',
[SettingKey.AI_MAX_TOKENS]: 'AI_MAX_TOKENS',
```

### 4.3 `server/services/setting.constants.ts` — INTERNAL_ONLY 扩充

补入运维级 env 键（避免未来错误添加 SettingKey 时泄露到 UI）：

```typescript
export const INTERNAL_ONLY_ENV_KEYS: string[] = [
    'AUTH_SECRET',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'AXIOM_API_TOKEN',
    'CRON_SECRET',
    'TASKS_TOKEN',
    'WEBHOOK_SECRET',
    'MOMEI_ENABLE_MCP_HTTP',
    'MOMEI_INSTALLED',
]
```

### 4.4 `utils/shared/env.ts` — 注释标记

为 Gap A 补齐的字段添加 `@settingKey` 标记，为 Internal 字段添加 `@internalOnly` 标记。

---

## 五、验收检查

- [x] Gap 清单产出（A/B 分类 + Internal）
- [x] 5 个 Gap A env var → `SettingKey` + `SETTING_ENV_MAP` 映射
- [x] INTERNAL_ONLY 扩充
- [x] `env.ts` 注释更新
- [x] `pnpm typecheck` + `pnpm lint` 通过
