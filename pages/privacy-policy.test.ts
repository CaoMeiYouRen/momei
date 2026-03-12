import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import PrivacyPolicyPage from './privacy-policy.vue'

function createPayload() {
    return {
        code: 200,
        data: {
            id: 'pp-v2',
            type: 'privacy_policy',
            language: 'zh-CN',
            content: '# Privacy\n正式隐私政策内容',
            version: '2.0.0',
            versionDescription: '正式版本',
            effectiveAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-02T00:00:00.000Z',
            authoritativeLanguage: 'zh-CN',
            authoritativeVersion: '2.0.0',
            isDefault: false,
            isReferenceTranslation: false,
            fallbackToAuthoritative: false,
            sourceAgreementId: null,
            sourceAgreementVersion: null,
            history: [
                {
                    id: 'pp-v2',
                    version: '2.0.0',
                    versionDescription: '正式版本',
                    language: 'zh-CN',
                    effectiveAt: '2026-02-01T00:00:00.000Z',
                    updatedAt: '2026-02-02T00:00:00.000Z',
                    isCurrentActive: true,
                },
            ],
        },
    }
}

describe('privacy policy page', () => {
    it('renders authoritative agreement metadata and history', async () => {
        registerEndpoint('/api/agreements/privacy-policy', () => createPayload())

        const wrapper = await mountSuspended(PrivacyPolicyPage, {
            global: {
                stubs: {
                    Tag: {
                        template: '<span class="tag">{{ value }}</span>',
                        props: ['value', 'severity'],
                    },
                    Divider: { template: '<hr />' },
                    ArticleContent: {
                        template: '<article class="article-content">{{ content }}</article>',
                        props: ['content'],
                    },
                },
            },
        })

        expect(wrapper.text()).toContain('2.0.0')
        expect(wrapper.text()).toContain('正式隐私政策内容')
        expect(wrapper.text()).toContain('正式版本')
    })
})
