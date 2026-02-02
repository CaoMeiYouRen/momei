## 邮件模板国际化使用指南

本指南说明如何在墨梅博客中使用新的邮件国际化系统。

### 快速开始

#### 1. 在 API 路由中发送国际化邮件

```typescript
// server/api/auth/register.post.ts
import { emailService } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
    // 获取用户的语言偏好
    const locale = getQuery(event).locale || getCookie(event, 'lang') || 'zh-CN'
    
    // 发送验证邮件，支持国际化
    await emailService.sendVerificationEmail(
        'user@example.com',
        'https://example.com/verify?token=xxx',
        locale // 可选参数，用于指定邮件语言
    )
    
    return { success: true }
})
```

#### 2. 在已登录用户场景中使用用户语言偏好

```typescript
// server/api/user/profile.put.ts
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    
    // 使用用户的偏好语言发送邮件
    await emailService.sendPasswordResetEmail(
        user.email,
        'https://example.com/reset?token=xxx',
        user.preferredLanguage // 用户已设置的语言
    )
    
    return { success: true }
})
```

### 支持的邮件类型与参数

#### 验证邮件 (verification)

```typescript
emailService.sendVerificationEmail(
    email: string,
    verificationUrl: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

#### 密码重置邮件 (passwordReset)

```typescript
emailService.sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

#### 登录验证码邮件 (loginOTP)

```typescript
emailService.sendLoginOTP(
    email: string,
    otp: string,
    expiresInMinutes?: number,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`, `{expiresIn}`

#### 邮箱验证码邮件 (emailVerificationOTP)

```typescript
emailService.sendEmailVerificationOTP(
    email: string,
    otp: string,
    expiresInMinutes?: number,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`, `{expiresIn}`

#### 密码重置验证码邮件 (passwordResetOTP)

```typescript
emailService.sendPasswordResetOTP(
    email: string,
    otp: string,
    expiresInMinutes?: number,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`, `{expiresIn}`

#### Magic Link 邮件 (magicLink)

```typescript
emailService.sendMagicLink(
    email: string,
    magicUrl: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

#### 邮箱更改验证邮件 (emailChangeVerification)

```typescript
emailService.sendEmailChangeVerification(
    currentEmail: string,
    newEmail: string,
    changeUrl: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

#### 安全通知邮件 (securityNotification)

```typescript
emailService.sendSecurityNotification(
    email: string,
    action: string,
    details: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

#### 订阅确认邮件 (subscriptionConfirmation)

```typescript
emailService.sendSubscriptionConfirmation(
    email: string,
    locale?: 'zh-CN' | 'en-US'
)
```

支持的参数：`{appName}`

### 添加新邮件类型

要添加新的邮件类型，请按以下步骤操作：

#### 第 1 步：更新语言配置文件

在 `server/utils/email/locales/zh-CN.ts` 中添加新的邮件类型：

```typescript
export const emailLocalesZhCN = {
    // ... 现有配置
    
    newEmailType: {
        title: '邮件主题',
        preheader: '预览文本',
        headerIcon: '📧',
        message: '邮件内容，支持 {appName} 等参数',
        // 其他必需字段...
    },
}
```

同时在 `en-US.ts` 中添加对应的英文翻译。

#### 第 2 步：在 service.ts 中添加方法

```typescript
export const emailService = {
    async sendNewEmailType(
        email: string,
        customData: string,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('newEmailType', locale)
            if (!i18n) {
                throw new Error('Failed to load email template')
            }

            const params = {
                appName: APP_NAME,
                // 添加其他参数...
            }

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    // ... 其他配置
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'new-email-type', email })
        } catch (error) {
            logger.email.failed({
                type: 'new-email-type',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },
}
```

#### 第 3 步：更新测试

在 `i18n.test.ts` 中添加相应的测试用例。

### 扩展新语言支持

要添加对新语言（如日文）的支持，请：

1. 创建新的语言配置文件 `server/utils/email/locales/ja-JP.ts`
2. 提供所有邮件类型的完整翻译
3. 在 `server/utils/email/locales/index.ts` 中注册新语言

```typescript
import { emailLocalesJaJP } from './ja-JP'

export const EMAIL_SUPPORTED_LOCALES = {
    'zh-CN': emailLocalesZhCN,
    'en-US': emailLocalesEnUS,
    'ja-JP': emailLocalesJaJP, // 新增
}
```

### 语言降级策略

如果指定的语言不被支持，系统将自动降级到默认语言（zh-CN）：

```typescript
// 请求法语 (fr-FR)，但系统不支持，将降级到 zh-CN
await emailService.sendVerificationEmail(
    email,
    verificationUrl,
    'fr-FR' // 不支持的语言
)
// ↓ 自动降级 ↓
// 发送中文邮件
```

### 常见问题

**Q: 如果用户没有设置偏好语言怎么办？**
A: 系统默认使用 `zh-CN` (中文)。建议在用户注册时获取浏览器语言，作为默认语言。

**Q: 参数不被正确替换怎么办？**
A: 检查以下几点：
- 参数名拼写是否正确（大小写敏感）
- 参数是否被正确传递给 `replaceParameters`
- 邮件模板中的占位符格式是否为 `{paramName}`

**Q: 如何测试特定语言的邮件？**
A: 使用单元测试或直接在代码中调用：
```typescript
const text = emailI18n.getText('verification', 'en-US')
console.log(text?.message) // 查看英文版本
```

### 最佳实践

1. **始终提供 locale 参数**：即使有默认值，也应该显式传递用户的语言偏好
2. **统一参数命名**：在所有邮件类型中保持参数名称一致
3. **提前准备翻译**：新功能上线前，应同时完成中英文翻译
4. **定期审查**：检查邮件内容是否过时或需要更新
5. **测试所有语言**：在发布前测试每种支持语言的邮件格式

### 相关文档

- [邮件国际化模块设计](../design/modules/email.md)
- [开发规范](./development.md)
- [API 规范](./api.md)
