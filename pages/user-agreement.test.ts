import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import UserAgreementPage from './user-agreement.vue'

function createPayload() {
    return {
        code: 200,
        data: {
            id: 'ua-v2-en',
            type: 'user_agreement',
            language: 'en-US',
            content: '# Agreement\nEnglish translation body',
            version: '2.0.0-en',
            versionDescription: 'English reference translation',
            effectiveAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-02T00:00:00.000Z',
            authoritativeLanguage: 'zh-CN',
            authoritativeVersion: '2.0.0',
            isDefault: false,
            isReferenceTranslation: true,
            fallbackToAuthoritative: false,
            sourceAgreementId: 'ua-v2',
            sourceAgreementVersion: '2.0.0',
            history: [
                {
                    id: 'ua-v2',
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

describe('user agreement page', () => {
    it('renders compliance metadata, translation notice, and history', async () => {
        registerEndpoint('/api/agreements/user-agreement', () => createPayload())

        const wrapper = await mountSuspended(UserAgreementPage, {
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

        expect(wrapper.text()).toContain('2.0.0-en')
        expect(wrapper.text()).toContain('2.0.0')
        expect(wrapper.text()).toContain('English translation body')
        expect(wrapper.text()).toContain('正式版本')
    })
})
