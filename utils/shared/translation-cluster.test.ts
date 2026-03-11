import { describe, expect, it } from 'vitest'
import {
    getTranslationClusterCandidates,
    hasSharedTranslationCluster,
    resolveTranslationClusterId,
} from './translation-cluster'

describe('translation-cluster', () => {
    it('should resolve translation id from explicit value first', () => {
        expect(resolveTranslationClusterId(' shared-cluster ', 'post-slug', 'post-id')).toBe('shared-cluster')
    })

    it('should fall back to slug when translation id is empty', () => {
        expect(resolveTranslationClusterId('  ', 'post-slug', 'post-id')).toBe('post-slug')
    })

    it('should expose unique candidates and optionally include id', () => {
        expect(getTranslationClusterCandidates({
            id: 'post-id',
            slug: 'post-slug',
            translationId: 'post-slug',
        }, { includeId: true })).toEqual(['post-slug', 'post-id'])
    })

    it('should match translation clusters by slug alias when translation id is missing', () => {
        expect(hasSharedTranslationCluster(
            { slug: 'typescript', translationId: null },
            { translationId: 'typescript', slug: 'ts' },
        )).toBe(true)
    })

    it('should optionally match by source and target ids for same-language records', () => {
        expect(hasSharedTranslationCluster(
            { id: 'category-id', slug: 'frontend' },
            { id: 'category-id', slug: 'frontend-copy' },
            {
                includeSourceId: true,
                includeTargetId: true,
            },
        )).toBe(true)
    })
})
