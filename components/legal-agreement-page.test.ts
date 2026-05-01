import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LegalAgreementPage from './legal-agreement-page.vue'

const copy = {
    authoritativeVersionTag: 'Authoritative',
    currentActiveTag: 'Current',
    formatEffectiveDateLabel: (date: string) => `Effective: ${date}`,
    formatFallbackNotice: (language: string) => `Fallback: ${language}`,
    formatLastUpdatedLabel: (date: string) => `Updated: ${date}`,
    formatReferenceTranslationNotice: (language: string, version: string) => `Reference ${language} ${version}`,
    formatVersionLabel: (version: string) => `Version: ${version}`,
    historyNoDescription: 'No description',
    historyTitle: 'History',
    legalNotice: 'Legal notice',
    referenceTranslationTag: 'Reference',
    title: 'Agreement',
    versionFallback: 'fallback-version',
}

function mountAgreementPage(overrides: Record<string, unknown> = {}) {
    return mount(LegalAgreementPage, {
        props: {
            agreement: {
                id: 'agreement-1',
                type: 'privacy_policy',
                language: 'zh-CN',
                content: '# Content',
                version: '2.0.0',
                versionDescription: 'Description',
                effectiveAt: '2026-02-01T00:00:00.000Z',
                updatedAt: '2026-02-02T00:00:00.000Z',
                authoritativeLanguage: 'zh-CN',
                authoritativeVersion: '2.0.0',
                isDefault: false,
                isReferenceTranslation: false,
                fallbackToAuthoritative: false,
                sourceAgreementId: null,
                sourceAgreementVersion: null,
                history: [],
                ...overrides,
            },
            copy,
            formatDate: (value?: null | string) => value ?? 'fallback-date',
        },
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
}

describe('legal agreement page', () => {
    it('renders the default notice branch', () => {
        const wrapper = mountAgreementPage({
            content: '# Default content',
            isDefault: true,
        })

        expect(wrapper.find('.default-notice').exists()).toBe(true)
        expect(wrapper.text()).toContain('Legal notice')
    })

    it('renders fallback notice branch', () => {
        const wrapper = mountAgreementPage({
            fallbackToAuthoritative: true,
        })

        expect(wrapper.find('.legal-page__notice').exists()).toBe(true)
        expect(wrapper.text()).toContain('Fallback: zh-CN')
    })
})
