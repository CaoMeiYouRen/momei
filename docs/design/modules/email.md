# 邮件国际化模块设计 (Email Internationalization Module Design)

## 📋 快速参考 (Quick Reference)

| 问题 | 答案 |
| :--- | :--- |
| **国际化范围** | 所有系统邮件类型 ✅ |
| **语言选择** | 根据用户偏好语言（已登录）或请求参数（未登录） ✅ |
| **文件存储** | `server/utils/email/locales/` 目录，与前端 i18n 分离 ✅ |
| **初期支持语言** | zh-CN（中文）和 en-US（英文） ✅ |
| **核心概念** | 一个 EmailI18nManager + 每种语言一个配置文件 |
| **邮件方法签名** | `async sendXxxEmail(email, url, locale?: string)` |

## 1. 概述 (Overview)

### 1.1 设计目标

实现墨梅博客邮件系统的完整国际化支持，使所有系统邮件（验证、通知、订阅等）能够根据**接收者用户的语言偏好**自动生成对应语言版本。初期支持中文（zh-CN）和英文（en-US）两种语言。

### 1.2 当前状态分析

- **现状**：邮件模板文本全部硬编码为中文
- **痛点**：
  - 国际化用户无法收到母语邮件
  - 维护多语言邮件需要复杂的条件判断
  - 缺乏系统化的多语言邮件管理方案
- **机会**：
  - 提升国际用户体验
  - 建立可扩展的多语言邮件架构
  - 为未来支持更多语言奠定基础

## 2. 设计原则 (Design Principles)

1. **用户中心**：邮件语言由接收者的语言偏好决定，而非系统默认语言
2. **独立管理**：邮件国际化字符串独立存储在 `server/utils/email/locales/`，与前端 i18n 分离
3. **可维护性**：结构清晰，便于新增邮件类型和语言支持
4. **渐进增强**：优先支持中英文，未来可轻松扩展至其他语言
5. **类型安全**：使用 TypeScript 确保翻译键的正确性，避免运行时错误

## 3. 架构设计 (Architecture Design)

### 3.1 系统流程图

```
用户操作 (注册/密码重置/订阅等)
    ↓
API 路由处理
    ↓
获取用户语言偏好 (user.preferredLanguage 或 session.locale)
    ↓
邮件服务 (emailService.send*)
    ↓
加载对应语言的邮件文本 (i18n/locales/email.zh-CN.json 或 email.en-US.json)
    ↓
使用用户语言的文本生成邮件模板
    ↓
发送邮件
```

### 3.2 核心组件

#### 3.2.1 邮件国际化管理器 (Email i18n Manager)

```typescript
// server/utils/email/i18n.ts
export interface EmailLocaleConfig {
  verification: {
    subject: string
    headerIcon: string
    message: string
    buttonText: string
    reminderContent: string
    securityTip: string
  }
  passwordReset: {
    subject: string
    // ...
  }
  // ... 其他邮件类型
}

export class EmailI18nManager {
  /**
   * 加载指定语言的邮件配置
   */
  loadLocale(locale: string): EmailLocaleConfig

  /**
   * 获取指定邮件类型的文本
   */
  getText(locale: string, emailType: string, textKey: string): string

  /**
   * 获取所有支持的语言列表
   */
  getSupportedLocales(): string[]
}
```

#### 3.2.2 邮件服务扩展 (Email Service Enhancement)

```typescript
// server/utils/email/service.ts
export const emailService = {
  /**
   * 发送邮箱验证邮件（支持多语言）
   * @param email - 收件人邮箱
   * @param verificationUrl - 验证链接
   * @param locale - 邮件语言 (默认: zh-CN)
   */
  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    locale?: string,
  ): Promise<void>

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    locale?: string,
  ): Promise<void>

  // ... 其他邮件方法类似扩展
}
```

## 4. 文件结构 (File Structure)

### 4.1 新增文件结构

```
server/utils/email/
├── locales/                          # 邮件国际化文件夹（新增）
│   ├── zh-CN.ts                      # 中文邮件配置
│   ├── en-US.ts                      # 英文邮件配置
│   └── index.ts                      # 语言配置导出
├── i18n.ts                           # 邮件i18n管理器（新增）
├── index.ts                          # 邮件发送核心
├── service.ts                        # 邮件服务（修改）
├── templates.ts                      # 模板引擎（修改）
├── templates-fallback.ts             # 回退模板
├── factory.ts                        # Nodemailer工厂
└── service.test.ts                   # 测试文件
```

### 4.2 邮件配置文件示例

```typescript
// server/utils/email/locales/zh-CN.ts
export const emailLocales = {
  verification: {
    subject: '验证您的{appName}邮箱地址',
    headerIcon: '🔐',
    message: '感谢您注册 <strong>{appName}</strong>！为了确保您的账户安全，请点击下方按钮验证您的邮箱地址。',
    buttonText: '验证邮箱地址',
    reminderContent: `• 此验证链接将在 <strong>24 小时</strong>后过期<br/>
• 如果您没有注册 {appName} 账户，请忽略此邮件<br/>
• 请勿将此链接分享给他人，以保护您的账户安全`,
    securityTip: '如果您没有请求重置密码，请忽略此邮件并检查您的账户安全。',
  },
  passwordReset: {
    subject: '重置您的{appName}账户密码',
    headerIcon: '🔑',
    message: '有人请求重置您的 <strong>{appName}</strong> 账户密码。如果是您本人操作，请点击下方按钮重置密码：',
    buttonText: '重置密码',
    reminderContent: `• 此重置链接将在 <strong>1 小时</strong>后过期<br/>
• 如果不是您本人操作，请立即检查您的账户安全<br/>
• 建议修改密码并启用两步验证`,
    securityTip: '如果您没有请求重置密码，请忽略此邮件并检查您的账户安全。',
  },
  // ... 其他邮件类型
}
```

## 5. 实现方案 (Implementation Plan)

### 5.1 邮件类型清单

当前需要国际化的邮件类型：

| 邮件类型 | 触发场景 | 关键文本 |
| :--- | :--- | :--- |
| `verification` | 用户注册、修改邮箱 | 验证链接、时效提醒 |
| `passwordReset` | 用户重置密码 | 重置链接、安全提示 |
| `emailVerificationOTP` | 邮箱验证 OTP | 验证码、时效提醒 |
| `loginOTP` | 登录验证码 | 验证码、安全提示 |
| `passwordResetOTP` | 密码重置 OTP | 验证码、时效提醒 |
| `emailChangeVerification` | 邮箱变更确认 | 新邮箱、确认链接 |
| `magicLink` | 无密码登录 | 登录链接、安全提示 |
| `securityNotification` | 账户安全事件 | 事件描述、安全提示 |
| `subscriptionConfirmation` | 订阅确认 | 订阅内容、取消链接 |
| `weeklyNewsletter` | 周刊推送 | 文章摘要、更多链接 |

### 5.2 语言获取策略

#### 用户已登录场景
```typescript
// 从用户偏好获取
const user = await getUserFromSession(event)
const locale = user.preferredLanguage || 'zh-CN'
await emailService.sendVerificationEmail(email, url, locale)
```

#### 用户未登录场景（注册流程）
```typescript
// 从请求参数或 Cookie 获取，默认为 zh-CN
const locale = getQuery(event).locale || getCookie(event, 'lang') || 'zh-CN'
await emailService.sendVerificationEmail(email, url, locale)
```

### 5.3 API 变更规范

#### 邮件发送方法签名 (基础示例)

```typescript
/**
 * 发送邮箱验证邮件
 * @param email - 收件人邮箱
 * @param verificationUrl - 验证链接
 * @param locale - 邮件语言，支持: 'zh-CN' | 'en-US'，默认: 'zh-CN'
 */
async sendVerificationEmail(
  email: string,
  verificationUrl: string,
  locale: string = 'zh-CN'
): Promise<void>
```

#### 错误处理

```typescript
// 不支持的语言将自动降级到 'zh-CN'
const supportedLocales = ['zh-CN', 'en-US']
const resolvedLocale = supportedLocales.includes(locale) ? locale : 'zh-CN'
```

## 6. 集成点 (Integration Points)

### 6.1 Better-Auth 集成

在 `lib/auth.ts` 中，邮件回调需要传递 locale 参数：

```typescript
// 示例：注册时获取邮件验证的语言
const authConfig = {
  callbacks: {
    async sendVerificationEmail(email, url, token, { request }) {
      const locale = extractLocaleFromRequest(request)
      await emailService.sendVerificationEmail(email, url, locale)
    },
  },
}
```

### 6.2 用户模型扩展

添加 `preferredLanguage` 字段到用户表（如未来实现用户偏好设置）：

```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  name?: string
  preferredLanguage: 'zh-CN' | 'en-US' // 新增字段
  // ... 其他字段
}
```

### 6.3 API 路由更新

所有涉及发送邮件的 API 路由都需要提取和传递 locale：

```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const locale = extractLocaleFromRequest(event)
  
  // 触发验证邮件发送时传递 locale
  await emailService.sendVerificationEmail(email, url, locale)
})
```

## 7. 国际化文本管理 (i18n Text Management)

### 7.1 文本参数替换

邮件文本中使用 `{paramName}` 格式的占位符，支持以下参数：

| 参数 | 说明 | 示例 |
| :--- | :--- | :--- |
| `{appName}` | 应用名称 | 墨梅博客 |
| `{baseUrl}` | 网站基础 URL | https://momei.cn |
| `{contactEmail}` | 联系邮箱 | admin@momei.cn |
| `{verificationCode}` | 验证码 | 123456 |
| `{expiresIn}` | 过期时间 | 5 分钟 |
| `{currentYear}` | 当前年份 | 2026 |

### 7.2 文本翻译维护

- **翻译完全性检查**：在新增邮件类型时，必须同时为 `zh-CN` 和 `en-US` 提供翻译
- **一致性验证**：通过单元测试确保所有语言的邮件类型结构一致
- **版本管理**：文本更新时记录变更日期和版本号

## 8. 实现快速指南 (Quick Implementation Guide)

### 8.1 开发者检查清单

在实现邮件国际化时，请按以下步骤进行：

#### 第 1 步：创建邮件配置文件
```
✅ 创建 server/utils/email/locales/zh-CN.ts
✅ 创建 server/utils/email/locales/en-US.ts
✅ 创建 server/utils/email/locales/index.ts
```

#### 第 2 步：实现 EmailI18nManager
```
✅ 创建 server/utils/email/i18n.ts
✅ 实现 loadLocale() 方法
✅ 实现 getText() 方法
✅ 实现 getSupportedLocales() 方法
```

#### 第 3 步：扩展邮件服务
```
✅ 修改 emailService 中所有方法，添加 locale? 参数
✅ 从用户偏好或请求参数获取 locale
✅ 调用 i18nManager 获取本地化文本
✅ 将本地化文本传递给模板引擎
```

#### 第 4 步：集成到 Better-Auth
```
✅ 在 lib/auth.ts 中配置邮件回调
✅ 提取请求中的 locale 参数
✅ 传递 locale 到 emailService 方法
```

#### 第 5 步：编写测试
```
✅ 单元测试：验证语言加载和文本提取
✅ 集成测试：验证邮件发送中的多语言流程
✅ 覆盖率：确保所有 locale 路径都被测试
```

### 8.2 常见集成点代码示例

#### 示例 1：用户已登录的邮件发送
```typescript
// server/api/user/profile.put.ts
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const locale = user.preferredLanguage || 'zh-CN'
  
  // 更新邮箱时发送验证邮件
  await emailService.sendVerificationEmail(
    newEmail,
    verificationUrl,
    locale // 使用用户偏好语言
  )
})
```

#### 示例 2：用户未登录的邮件发送（注册流程）
```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const locale = getQuery(event).locale || getCookie(event, 'lang') || 'zh-CN'
  
  await emailService.sendVerificationEmail(
    email,
    verificationUrl,
    locale
  )
})
```

#### 示例 3：Better-Auth 邮件回调
```typescript
// lib/auth.ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    async sendVerificationEmail(params) {
      const { email, url } = params
      const locale = extractLocaleFromHeaders(params.headers) || 'zh-CN'
      
      await emailService.sendVerificationEmail(email, url, locale)
    },
  },
})
```

## 9. 测试策略 (Testing Strategy)

### 9.1 单元测试范围

## 9. 测试策略 (Testing Strategy)

### 9.1 单元测试范围

```typescript
describe('邮件国际化系统', () => {
  // 1. 语言加载测试
  it('应该正确加载中文邮件配置', () => {})
  it('应该正确加载英文邮件配置', () => {})

  // 2. 文本提取测试
  it('应该返回正确的中文邮件文本', () => {})
  it('应该在不支持的语言时降级到 zh-CN', () => {})

  // 3. 参数替换测试
  it('应该正确替换邮件文本中的占位符', () => {})

  // 4. 邮件发送测试
  it('应该使用指定语言发送邮件', () => {})
  it('应该在用户已登录时使用用户偏好语言', () => {})
})
```

### 9.2 集成测试

- 验证注册流程中的多语言邮件发送
- 验证密码重置邮件在不同语言下的正确性
- 验证不支持的语言的降级行为

## 10. 未来扩展 (Future Enhancements)

### 10.1 支持更多语言

当需要添加新语言（如日语、法语）时：

1. 在 `server/utils/email/locales/` 中添加对应文件（如 `ja-JP.ts`）
2. 提供所有邮件类型的完整翻译
3. 在 `EmailI18nManager` 中注册新语言
4. 更新相关测试用例

### 10.2 翻译协作工作流

建议未来集成翻译管理平台（如 Crowdin）以支持社区翻译。

### 10.3 高级功能

- **邮件文本版本控制**：追踪文本变更历史
- **A/B 测试**：测试不同文本版本对用户的影响
- **本地化日期/时间**：邮件中的日期根据用户语言自动格式化
- **多模板主题**：不同语言可能需要不同的邮件模板设计

## 11. 相关文档

- [API 规范](../api.md)
- [开发规范](../../standards/development.md)
- [安全规范](../../standards/security.md)
- [Better-Auth 集成](./auth.md)
- [系统设置模块](./system-settings.md)
