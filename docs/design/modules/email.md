# 邮件系统 (Email System)

## 1. 概述 (Overview)

墨梅博客拥有一个功能完备、原生支持国际化的邮件系统，用于验证码发送、站务通知等业务场景。

## 2. 核心特性

- **语言动态感知**: 自动根据接收者的 `preferredLanguage`（或会话 Locale）加载对应翻译。
- **响应式模板**: 采用兼容主流邮件客户端的 HTML Table 布局，外观风格与 Momei `ArticleCard` 保持一致。
- **OTP 支持**: 深度集成 One-Time Password 逻辑，支持登录、重置密码等验证。

## 3. 技术架构

### 3.1 核心组件
- **EmailService**: 统一发送入口。
- **EmailI18nManager**: 管理位于 `server/utils/email/locales/` 的多语言配置。
- **Template Engine**: 动态替换占位符（如 `{{articleCover}}`, `{{otpCode}}`）。

### 3.2 邮件模板设计
- **布局**: 基于 600px 宽度的响应式容器。
- **视觉**: 支持封面图嵌入、品牌 Logo、带有 CTA 的引导按钮。

## 4. 后端国际化映射
邮件正文、标题均在后端翻译文件中定义，确保非浏览器环境下（如定时任务触发）仍能准确输出对应语言。

---
> 关联代码: `server/services/email.ts` | `server/utils/email/`
