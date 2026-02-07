# 邮件系统 (Email System)

## 1. 概述 (Overview)

墨梅博客拥有一个功能完备的邮件系统，支持系统通知、验证、订阅等多种场景。该系统实现了完整的国际化支持，能根据接收者的语言偏好自动发送对应语言版本的邮件。

## 2. 核心特性 (Core Features)

- **原生国际化**: 邮件语言由接收者的语言偏好决定（`user.preferredLanguage` 或 `session.locale`）。
- **多语言支持**: 目前支持中文 (zh-CN) 和英文 (en-US)，具备良好的扩展性。
- **模板引擎**: 基于 HTML 的响应式邮件模板，确保在不同客户端显示一致。
- **验证码支持**: 支持登录验证、邮箱绑定验证、密码重置验证码等多种 OTP 场景。
- **配置即激活**: 只要配置了 SMTP 服务，邮件系统即自动激活。

## 3. 技术架构 (Technical Architecture)

### 3.1 核心组件

- **EmailI18nManager**: 负责加载和管理不同语言的邮件文本配置。
- **EmailService**: 提供统一的邮件发送接口，如 `sendVerificationEmail`, `sendLoginOTP` 等。
- **Nodemailer Factory**: 底层邮件发送引擎。

### 3.2 国际化配置存储
邮件国际化字符串独立存储在 `server/utils/email/locales/` 目录中，与前端 i18n 系统分离。

## 4. 使用指南 (Usage Guide)

### 4.1 发送国际化邮件

所有邮件发送方法都接收一个可选的 `locale` 参数：

```typescript
import { emailService } from '~/server/utils/email'

// 在 API 路由中发送
export default defineEventHandler(async (event) => {
    const locale = getLocale(event) // 获取请求语言
    await emailService.sendVerificationEmail(email, url, locale)
})
```

### 4.2 支持的邮件类型

| 邮件类型 | 描述 | 参数示例 |
| :--- | :--- | :--- |
| `verification` | 账号激活/验证 | `verificationUrl` |
| `passwordReset` | 密码重置链接 | `resetUrl` |
| `loginOTP` | 登录验证码 | `otp`, `expiresIn` |
| `emailVerificationOTP` | 邮箱绑定验证码 | `otp`, `expiresIn` |
| `passwordResetOTP` | 密码重置验证码 | `otp`, `expiresIn` |
| `securityNotification` | 安全提醒（如异地登录） | 无 |
| `subscriptionConfirmation` | 订阅确认 | 无 |
| `weeklyNewsletter` | 周刊推送 | `posts` |

## 5. 开发建议 (Development)

### 5.1 添加新语言
在 `server/utils/email/locales/` 下创建新的语言文件（如 `fr-FR.ts`），并在 `index.ts` 中导出。

### 5.2 修改邮件模板
邮件模板位于 `server/utils/email/templates.ts`。建议保持 HTML 结构简洁，以兼容各类邮件客户端。

---

> 相关代码地址: [server/utils/email/](https://github.com/CaoMeiYouRen/momei/tree/master/server/utils/email)
