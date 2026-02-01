import { getActiveAgreementContent } from '@/server/services/agreement'

/**
 * GET /api/public/agreements/privacy-policy
 * 获取隐私政策内容
 */
export default defineEventHandler(async () => {
    try {
        const agreement = await getActiveAgreementContent('privacy_policy')

        if (!agreement) {
            // 返回示例内容和标记
            return {
                code: 200,
                data: {
                    id: 'default',
                    type: 'privacy_policy',
                    language: 'zh-CN',
                    content: getDefaultPrivacyPolicy(),
                    isDefault: true,
                    version: null,
                },
            }
        }

        return {
            code: 200,
            data: {
                id: agreement.id,
                type: agreement.type,
                language: agreement.language,
                content: agreement.content,
                isDefault: false,
                version: agreement.version,
                isMainVersion: agreement.isMainVersion,
            },
        }
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Failed to fetch privacy policy',
        }
    }
})

function getDefaultPrivacyPolicy(): string {
    return `### ⚠️ 注意：这是系统默认的隐私政策示例。它仅供参考，不具有任何法律效力。

仅当站点管理员在后台配置了真实的隐私政策后，该政策才具有法律效力。

## 1. 概述

本隐私政策说明了本网站如何收集、使用、保护和处理您的个人信息。当您使用本网站的服务时，即表示您同意本政策的所有条款。

## 2. 收集的信息

我们可能收集以下类型的信息：

- **您直接提供的信息**：如注册账户时输入的名称、邮箱地址、头像等。
- **自动收集的信息**：如您的 IP 地址、浏览器类型、访问时间、浏览的页面等。
- **Cookies 和类似技术**：用于改善用户体验和站点性能。

## 3. 信息的使用

我们使用收集的信息用于以下目的：

- 提供和改进网站服务。
- 与您沟通，回答您的问题。
- 分析网站使用情况，优化用户体验。
- 维护网站安全和防止欺诈。

## 4. 信息的保护

我们采用适当的技术措施保护您的个人信息安全，包括加密、安全服务器等。但互联网并非绝对安全，我们无法保证 100% 的安全性。

## 5. 第三方共享

除非获得您的同意或法律规定，我们不会将您的个人信息与第三方共享。我们的服务提供商需要保护您的信息并按照我们的指示使用您的信息。

## 6. 用户权利

您有权访问、更正、删除您的个人信息。您也可以随时撤回之前的同意。请与我们联系以行使这些权利。

## 7. 政策更新

我们可能会不时更新本隐私政策。当我们进行重大修改时，会在网站上发布通知。持续使用本网站表示您接受更新的政策。

## 8. 联系我们

如您对本隐私政策有任何疑问或想行使您的权利，请通过本网站提供的联系方式与我们联系。`
}
