# 系统设置与智能混合模式设计文档 (System Settings & Hybrid Mode)

## 1. 背景与目标 (Background & Goals)

为了提供“零配置”部署体验，同时保证生产环境的安全性和灵活性，墨梅博客采用了**智能混合模式 (Smart Hybrid Mode)** 来处理系统配置。

**核心目标**:
- **安全性**: 敏感凭据（如 Secret Keys）优先通过环境变量管控。
- **灵活性**: 允许管理员在后台动态修改非敏感配置。
- **可视化**: 管理后台能清晰分辨配置来源（ENV 或 DB）。
- **无感迁移**: 安装时自动同步环境变量至数据库。

## 2. 智能混合模式逻辑 (Hybrid Logic)

### 2.1 优先级模型
系统在读取配置时遵循以下优先级：
1. **环境变量 (ENV)**: 具有最高权威，通常用于生产环境安全控制。
2. **数据库配置 (DB)**: 后台管理的持久化存储。
3. **默认值 (Default)**: 代码中定义的 fallback 值。

公式：`EffectiveValue = ENV ?? DB ?? Default`

### 2.2 来源探测 (Source Detection)
后台 API 会返回配置的来源状态：
- `env`: 值来自环境变量，后台禁止修改且显示锁定图标。
- `db`: 值来自数据库，允许后台自由修改。
- `default`: 常规默认状态。

## 3. 核心功能设计 (Core Features)

### 3.1 自动同步 (Auto-Sync during Installation)
在 `InstallationService` 执行期间，系统会扫描预定义的候选变量清单。如果检测到 `.env` 文件或环境中有对应的值，则将其作为初始值写入数据库的 `Setting` 表中。

### 3.2 敏感数据脱敏 (Data Masking)
- **Masking 策略**:
    - `password`: 全星号掩盖 (`********`)。
    - `key`: 仅显示前 4 位和后 4 位。
    - `email`: 掩盖邮箱用户名的中间部分。
- **占位符保护**: 如果修改时提交的值与掩码占位符一致，系统将忽略此次更新，防止误删真实密钥。

## 4. 变量定义清单 (Configuration Catalog)

| 分类 | 变量名示例 | 推荐级别 (Level) | 脱敏类型 |
| :--- | :--- | :---: | :--- |
| **基础 (General)** | SITE_TITLE, SITE_DESCRIPTION | 0 (Public) | 无 |
| **认证 (Auth)** | GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_ID | 2 (Admin) | `password` |
| **安全 (Security)** | TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY | 2 (Admin) | `password` |
| **限额 (Limits)** | MAX_UPLOAD_SIZE, EMAIL_DAILY_LIMIT | 1 (Restricted) | 无 |
| **品牌 (Branding)** | SITE_OPERATOR, DEFAULT_COPYRIGHT | 0 (Public) | 无 |

## 5. 交互流程 (Interactive Flow)

1. **进入后台**: 请求 `/api/admin/settings`。
2. **数据处理**: `SettingService` 合并 ENV 和 DB 数据，标记哪些字段被 ENV 锁定。
3. **前端渲染**: 
    - 被 ENV 锁定的字段，UI 渲染为 `disabled` 状态。
    - 提交修改时，仅发送有变动且未被锁定的字段。
4. **后端保存**: `PATCH /api/admin/settings` 接收数据，校验 `isMaskedPlaceholder`。

## 6. 合规性与安全 (Compliance)

- 管理员必须具有 `admin` 权限方可访问。
- Level 3 (System) 级别的变量仅在服务端内部使用，绝不通过 API 暴露给前端。
