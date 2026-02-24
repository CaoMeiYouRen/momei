# 订阅系统设计文档 (Subscription System Design)

## 1. 概述 (Overview)

墨梅博客提供多样化的内容订阅方式，确保读者能够及时获取更新。订阅系统包含两个核心组件：
1. **内容馈送 (Feeds)**：基于标准的 RSS, Atom 和 JSON Feed 协议。
2. **邮件订阅 (Email Subscriptions)**：提供原生的邮件订阅、管理及退订流程。

## 2. 内容馈送 (Content Feeds)

### 2.1 支持格式
墨梅自动为全站及各个分类/标签生成订阅源：
- **RSS 2.0 (`/feed.xml`)**: 最通用的聚合格式。
- **Atom 1.0 (`/feed.atom`)**: 现代且鲁棒的 XML 格式。
- **JSON Feed 1.1 (`/feed.json`)**: 开发者友好的 JSON 格式。

### 2.2 自动过滤与安全
- **私密内容过滤**: 标记为 `private` 或受 `password` 保护的文章将自动从所有 Feed 中移除，防止订阅源泄露敏感信息。
- **国际化分流**: 针对不同语言 (`/zh-CN/feed.xml`, `/en-US/feed.xml`) 提供独立的订阅源，确保内容语言一致性。

### 2.3 技术实现
- **库**: 使用 `feed` 库生成标准化的 XML/JSON。
- **关联路径**: `server/utils/feed.ts` (核心转换逻辑) | `server/routes/feed.*.ts` (路由入口)。

## 3. 邮件订阅 (Email Subscriptions)

### 3.1 核心流程 (Core Flow)

1. **订阅提交**: 访客在页面底部的订阅框输入邮箱。
2. **双重确认 (Double Opt-in)**: 系统发送确认邮件。只有在点击邮件内的确认链接（或等待管理员手动审核后，视配置而定）才正式加入列表。
3. **内容推送**: 暂定触发模式。未来可支持发布新文章时自动为所有订阅者排队发送推送邮件。
4. **自主退订**: 每一封发出的邮件底部均包含合法的 `Unsubscribe` 链接。

### 3.2 订阅者管理
- **管理后台**: 管理员可以查看订阅者列表、导出数据 (CSV/JSON)、手动添加或封禁订阅者。
- **订阅者实体 (`Subscriber`)**:
    - `email`: 唯一标识。
    - `status`: `pending`, `active`, `unsubscribed`。
    - `locale`: 订阅时的语言偏好（用于发送对应语言的通知）。

### 3.3 安全与反垃圾 (Anti-Spam)
- **验证码保护**: 订阅接口强制要求 Cloudflare Turnstile 或相关验证码 Token，防止刷接口。
- **限流**: 严格限制单 IP 的订阅请求频率。

## 4. 模块关联 (Module Linkages)

- **Email**: 用于发送订阅确认、文章推送及退订成功通知。
- **Blog**: 页面侧边栏和页脚展示订阅组件。
- **Interactions**: 与文章可见性 (`subscriber` 策略) 联动，只有激活态订阅者才能通过邮件验证码/链接解锁受限内容。

## 5. 技术配置 (Technical Configuration)

邮件订阅功能属于 **[核心推荐 (Level 2)](../guide/deploy#level-2-核心推荐-core-recommended)** 部署项，依赖以下系统配置：

| 配置项 | 环境变量 (ENV) | 说明 |
| :--- | :--- | :--- |
| SMTP 服务 | `NUXT_SMTP_HOST`, `NUXT_SMTP_USER`... | 必须配置 SMTP 才能发送确认邮件 |
| 验证码 (Turnstile) | `NUXT_TURNSTILE_SECRET_KEY` | 强烈建议配置验证码防止垃圾订阅 |

详细配置参考：[环境与系统设置映射表](../guide/variables)

## 6. 待办计划 (Roadmap)

- [x] 实现全站 RSS/Atom/JSON Feed 输出。
- [x] 实现订阅者管理后台 (CRUD)。
- [ ] 增加基于全站分类/标签的细粒度邮件订阅选择。
- [ ] 增加博文自动推送 (Post Auto-notification) 任务队列。
