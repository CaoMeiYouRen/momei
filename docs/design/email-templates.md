# 邮件模板设计方案 (Email Template Design)

## 1. 设计目标
为“墨梅”博客提供一套具备高度辨识度、专业感且响应式的邮件模板系统。借鉴前端 `ArticleCard` 视觉风格，确保在各种邮件客户端（网页端、Outlook、移动端）中表现一致。

## 2. 核心 HTML 骨架 (Responsive Table-based Layout)
由于邮件客户端对 CSS 支持有限，采用传统的 `table` 布局辅以内联样式。

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* 仅在支持的客户端中生效的基础样式 */
        .cta-button:hover { background-color: #0056b3 !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Cover Image -->
                    {{#if articleCover}}
                    <tr>
                        <td>
                            <img src="{{articleCover}}" alt="Cover" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
                        </td>
                    </tr>
                    {{/if}}

                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 24px; font-weight: bold; padding-bottom: 20px;">
                                        {{articleTitle}}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #666666; font-size: 16px; line-height: 1.6; padding-bottom: 30px;">
                                        {{articleSummary}}
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <!-- CTA Button -->
                                        <a href="{{articleLink}}" class="cta-button" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                            {{$t('common.read_full_article')}}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="padding: 20px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                &copy; {{year}} {{siteName}}. All rights reserved. <br>
                                {{icpInfo}} <br>
                                <a href="{{unsubLink}}" style="color: #007bff; text-decoration: underline;">退订邮件 (Unsubscribe)</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## 3. 动态变量映射表

| 变量键 | 说明 | 默认逻辑 |
| :--- | :--- | :--- |
| `{{articleTitle}}` | 标题 | 映射自博客标题或营销任务标题 |
| `{{articleSummary}}` | 摘要内容 | 支持 Markdown 渲染后的纯文本或 HTML 片段 |
| `{{articleCover}}` | 封面图 | 绝对路径 URL |
| `{{articleLink}}` | 详情链接 | 文章永久链接或指定活动链接 |
| `{{userName}}` | 订阅者称呼 | `Subscriber.name` 或“尊敬的用户” |
| `{{siteName}}` | 站点名称 | 来自系统配置 |
| `{{unsubLink}}` | 退订链接 | 带 Token 的自动退订地址 |

## 4. 类型定制化逻辑
- **UPDATE/MAINTENANCE**: 隐藏封面图部分，加粗标题，增加紧急程度标识。
- **BLOG_POST**: 强制显示封面图，并增加分类标签展示。
- **SERVICE**: 采用列表形式展示变动项目。

## 5. 预览与测试
在管理员后台 `marketing-campaign-form.vue` 中，应提供一个 **"发送测试邮件"** 的功能，允许管理员在正式群发前向自己的邮箱发送一封预览邮件。
