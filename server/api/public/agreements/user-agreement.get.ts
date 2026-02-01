import { getActiveAgreementContent } from '@/server/services/agreement'

/**
 * GET /api/public/agreements/user-agreement
 * 获取用户协议内容
 */
export default defineEventHandler(async () => {
    try {
        const agreement = await getActiveAgreementContent('user_agreement')

        if (!agreement) {
            // 返回示例内容和标记
            return {
                code: 200,
                data: {
                    id: 'default',
                    type: 'user_agreement',
                    language: 'zh-CN',
                    content: getDefaultUserAgreement(),
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
            message: error.message || 'Failed to fetch user agreement',
        }
    }
})

function getDefaultUserAgreement(): string {
    return `### ⚠️ 注意：这是系统默认的用户协议示例。它仅供参考，不具有任何法律效力。

仅当站点管理员在后台配置了真实的用户协议后，该协议才具有法律效力。

## 1. 特别提示

本协议是用户与本网站之间关于您访问和使用本站所订立的法律协议。用户点击"同意"按钮即表示用户已阅读、理解并同意接受本协议及其所有修改、变更。

## 2. 服务内容

本站提供博客内容浏览、评论、订阅等功能。运营方有权根据实际情况随时调整服务内容。

## 3. 用户行为规范

您在使用本站服务时，必须遵守当地法律法规，不得利用本站从事违法活动，包括但不限于发布违法言论、侵犯他人权利等。

## 4. 知识产权

本站发布的原创内容版权归原作者所有。除非另有声明，本站内容通常遵循 CC 协议发布，请在转载时查阅具体文章的版权声明。

## 5. 免责声明

本站服务按"现状"提供，运营方不对服务的及时性、安全性、准确性作任何保证。因网络环境、不可抗力等因素导致的损失，运营方不承担责任。

## 6. 协议修改

运营方有权随时修改本协议条款。修改后的协议条款对所有用户有约束力。用户在使用服务时应定期查阅本协议的更新。

## 7. 适用法律

本协议的成立、生效、执行、解释及纠纷解决均适用中华人民共和国法律。任何因本服务所产生的纠纷均应由有管辖权的人民法院管辖。`
}
