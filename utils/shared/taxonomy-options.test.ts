import { describe, expect, it } from 'vitest'
import { buildPreferredTaxonomyOptions, resolveTaxonomyDisplayLanguageOrder } from './taxonomy-options'

describe('taxonomy-options', () => {
    it('should prefer the current content language translation first', () => {
        const [option] = buildPreferredTaxonomyOptions([
            {
                id: 'cluster-root',
                name: 'Technology',
                language: 'en-US',
                translationId: 'tech-group',
                translations: [
                    { id: 'cat-zh', name: '技术', language: 'zh-CN', translationId: 'tech-group' },
                    { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
                ],
            },
        ], {
            contentLanguage: 'zh-CN',
            uiLanguage: 'en-US',
        })

        expect(option).toMatchObject({
            id: 'cat-zh',
            name: '技术',
            language: 'zh-CN',
            translationId: 'tech-group',
        })
    })

    it('should fall back to the ui locale chain when content language translation is missing', () => {
        const [option] = buildPreferredTaxonomyOptions([
            {
                id: 'cluster-root',
                name: 'Technology',
                language: 'en-US',
                translationId: 'tech-group',
                translations: [
                    { id: 'cat-zh', name: '技术专题', language: 'zh-CN', translationId: 'tech-group' },
                    { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
                ],
            },
        ], {
            contentLanguage: 'ko-KR',
            uiLanguage: 'zh-TW',
        })

        expect(option).toMatchObject({
            id: 'cat-zh',
            name: '技术专题',
            language: 'zh-CN',
        })
    })

    it('should keep a stable translation cluster id when selected translation lacks explicit translationId', () => {
        const [option] = buildPreferredTaxonomyOptions([
            {
                id: 'cluster-root',
                name: 'Root',
                language: 'en-US',
                slug: 'root-category',
                translationId: null,
                translations: [
                    { id: 'cat-zh', name: '根分类', language: 'zh-CN', slug: 'root-category', translationId: null },
                ],
            },
        ], {
            contentLanguage: 'zh-CN',
            uiLanguage: 'zh-CN',
        })

        if (!option) {
            throw new Error('Expected a taxonomy option to be resolved')
        }

        expect(option.translationId).toBe('root-category')
    })

    it('should build a unique display order with content language first', () => {
        expect(resolveTaxonomyDisplayLanguageOrder('ko-KR', 'zh-TW')).toEqual(['ko-KR', 'zh-TW', 'zh-CN', 'en-US'])
    })
})
