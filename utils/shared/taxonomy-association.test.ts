import { describe, expect, it } from 'vitest'
import { resolveTaxonomyAssociationState } from './taxonomy-association'

describe('taxonomy-association', () => {
    it('should resolve linked peers from translationId matches', () => {
        const state = resolveTaxonomyAssociationState({
            currentLanguage: 'zh-CN',
            translationId: 'tech-group',
            candidates: [
                { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
                { id: 'cat-tw', name: '技術專題', language: 'zh-TW', translationId: 'tech-group' },
            ],
        })

        expect(state.clusterId).toBe('tech-group')
        expect(state.sameLanguageConflict).toBeNull()
        expect(state.linkedPeers).toHaveLength(2)
    })

    it('should use slug fallback when translationId is empty', () => {
        const state = resolveTaxonomyAssociationState({
            currentLanguage: 'zh-CN',
            translationId: null,
            slug: 'tech-topic',
            candidates: [
                { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-topic', slug: 'tech-topic-en' },
            ],
        })

        expect(state.clusterId).toBe('tech-topic')
        expect(state.usesSlugFallback).toBe(true)
        expect(state.linkedPeers).toHaveLength(1)
    })

    it('should detect same-language conflicts separately', () => {
        const state = resolveTaxonomyAssociationState({
            currentId: 'cat-current',
            currentLanguage: 'zh-CN',
            translationId: 'tech-group',
            candidates: [
                { id: 'cat-current', name: '技术', language: 'zh-CN', translationId: 'tech-group' },
                { id: 'cat-conflict', name: '技术专题', language: 'zh-CN', translationId: 'tech-group' },
                { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
            ],
        })

        expect(state.sameLanguageConflict?.id).toBe('cat-conflict')
        expect(state.linkedPeers).toEqual([
            { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
        ])
    })

    it('should return an empty state when no cluster can be resolved', () => {
        const state = resolveTaxonomyAssociationState({
            currentLanguage: 'zh-CN',
            translationId: null,
            slug: null,
            candidates: [
                { id: 'cat-en', name: 'Technology', language: 'en-US', translationId: 'tech-group' },
            ],
        })

        expect(state.clusterId).toBeNull()
        expect(state.relatedCandidates).toEqual([])
    })
})
